"""
Codeflow Backend - Real-Time Collaborative Code Editor
Flask + Socket.IO with OT engine, room-based collaboration,
owner-controlled accept/reject, dual-mode editor, and code execution.
"""

import os, json, uuid, subprocess, tempfile, time
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from ot_engine import Operation, transform

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "codeflow-secret")
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# In-Memory State 
rooms_state = {}       # { room_id: { document, revision, history, clients, owner, pending_changes, language, mode, require_approval } }
connected_clients = {} # { sid: { username, room_id } }

LANGUAGE_CONFIG = {
    "python":     {"ext": ".py",   "cmd": ["python3", "{file}"], "timeout": 5},
    "javascript": {"ext": ".js",   "cmd": ["node", "{file}"], "timeout": 5},
    "cpp":        {"ext": ".cpp",  "compile": ["g++", "-o", "{out}", "{file}"], "cmd": ["{out}"], "timeout": 10},
    "java":       {"ext": ".java", "compile": ["javac", "{file}"], "cmd": ["java", "-cp", "{dir}", "Main"], "timeout": 10},
}

# REST Endpoints

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "rooms": len(rooms_state)})

@app.route("/api/rooms", methods=["POST"])
def create_room():
    data = request.json or {}
    room_id = data.get("room_id", str(uuid.uuid4())[:8])
    username = data.get("username", "anonymous")
    if room_id in rooms_state:
        return jsonify({"error": "Room already exists"}), 409
    rooms_state[room_id] = {
        "document": "", "revision": 0, "history": [],
        "clients": {}, "owner": username, "pending_changes": [],
        "language": data.get("language", "javascript"),
        "mode": data.get("mode", "code"),  # "code" or "preview"
        "require_approval": False,
    }
    return jsonify({"room_id": room_id, "owner": username}), 201

@app.route("/api/rooms/<room_id>")
def get_room(room_id):
    if room_id not in rooms_state:
        return jsonify({"error": "Room not found"}), 404
    r = rooms_state[room_id]
    return jsonify({
        "room_id": room_id, "document": r["document"], "revision": r["revision"],
        "language": r["language"], "mode": r["mode"], "owner": r["owner"],
        "clients": [{"username": c["username"], "cursor": c.get("cursor", 0)} for c in r["clients"].values()],
        "pending_changes_count": len(r["pending_changes"]),
    })

@app.route("/api/rooms/<room_id>/pending")
def get_pending(room_id):
    if room_id not in rooms_state:
        return jsonify({"error": "Room not found"}), 404
    return jsonify({"pending_changes": [
        {"id": p["id"], "author": p["author"], "operation": p["operation"].to_dict(),
         "timestamp": p["timestamp"], "description": p["description"]}
        for p in rooms_state[room_id]["pending_changes"]
    ]})

@app.route("/api/execute", methods=["POST"])
def execute_code():
    data = request.json
    code, lang = data.get("code", ""), data.get("language", "python")
    stdin_input = data.get("stdin", "")
    if lang not in LANGUAGE_CONFIG:
        return jsonify({"error": f"Unsupported language: {lang}"}), 400
    return jsonify(_run_code(code, lang, LANGUAGE_CONFIG[lang], stdin_input))

def _run_code(code, lang, config, stdin_input=""):
    with tempfile.TemporaryDirectory() as tmpdir:
        fname = "Main" + config["ext"] if lang == "java" else "code" + config["ext"]
        fpath, outpath = os.path.join(tmpdir, fname), os.path.join(tmpdir, "code.out")
        with open(fpath, "w") as f:
            f.write(code)
        try:
            if "compile" in config:
                cmd = [c.replace("{file}", fpath).replace("{out}", outpath) for c in config["compile"]]
                r = subprocess.run(cmd, capture_output=True, text=True, timeout=config["timeout"], cwd=tmpdir)
                if r.returncode != 0:
                    return {"stdout": "", "stderr": r.stderr, "exit_code": r.returncode, "error": "Compilation failed"}
            cmd = [c.replace("{file}", fpath).replace("{out}", outpath).replace("{dir}", tmpdir) for c in config["cmd"]]
            r = subprocess.run(cmd, capture_output=True, text=True, input=stdin_input, timeout=config["timeout"], cwd=tmpdir)
            return {"stdout": r.stdout, "stderr": r.stderr, "exit_code": r.returncode, "error": None}
        except subprocess.TimeoutExpired:
            return {"stdout": "", "stderr": "", "exit_code": -1, "error": "Time Limit Exceeded"}
        except Exception as e:
            return {"stdout": "", "stderr": str(e), "exit_code": -1, "error": "Execution failed"}

# ── Socket.IO Events ─────────────────────────────────────────────────────────

@socketio.on("connect")
def on_connect():
    print(f"Connected: {request.sid}")

@socketio.on("disconnect")
def on_disconnect():
    sid = request.sid
    if sid in connected_clients:
        c = connected_clients.pop(sid)
        rid = c.get("room_id")
        if rid and rid in rooms_state:
            rooms_state[rid]["clients"].pop(sid, None)
            leave_room(rid)
            emit("user_left", {"username": c["username"],
                "clients": _client_list(rid)}, room=rid)

@socketio.on("join_room")
def on_join(data):
    rid, username = data.get("room_id"), data.get("username", "anon")
    sid = request.sid
    if rid not in rooms_state:
        return emit("error", {"message": "Room not found"})
    room = rooms_state[rid]
    join_room(rid)
    connected_clients[sid] = {"username": username, "room_id": rid}
    room["clients"][sid] = {"username": username, "cursor": 0}
    emit("room_state", {
        "document": room["document"], "revision": room["revision"],
        "language": room["language"], "mode": room["mode"], "owner": room["owner"],
        "clients": _client_list(rid), "pending_changes_count": len(room["pending_changes"]),
    })
    emit("user_joined", {"username": username, "clients": _client_list(rid)},
         room=rid, include_self=False)

@socketio.on("operation")
def on_operation(data):
    """Core OT handler — transforms, applies, and broadcasts operations."""
    rid = data.get("room_id")
    client_rev = data.get("revision")
    op_data = data.get("operation")
    username = data.get("username", "anon")
    sid = request.sid
    if rid not in rooms_state:
        return emit("error", {"message": "Room not found"})
    room = rooms_state[rid]
    incoming = Operation.from_dict(op_data)

    # Transform against missed operations (core OT algorithm)
    if client_rev < room["revision"]:
        for hist_op in room["history"][client_rev:room["revision"]]:
            incoming, _ = transform(incoming, hist_op)

    # Owner approval check
    if not (room["owner"] == username) and room.get("require_approval"):
        pid = str(uuid.uuid4())[:8]
        pending = {"id": pid, "author": username, "operation": incoming,
                   "timestamp": time.time(), "description": _describe_op(incoming), "client_sid": sid}
        room["pending_changes"].append(pending)
        emit("change_pending", {"id": pid, "message": "Pending owner approval"})
        owner_sid = _find_owner_sid(rid)
        if owner_sid:
            emit("new_pending_change", {"id": pid, "author": username,
                "description": pending["description"], "pending_count": len(room["pending_changes"])}, room=owner_sid)
        return

    _apply_op(rid, incoming, username, sid)

@socketio.on("accept_change")
def on_accept(data):
    rid, cid, username = data.get("room_id"), data.get("change_id"), data.get("username")
    if rid not in rooms_state:
        return emit("error", {"message": "Room not found"})
    room = rooms_state[rid]
    if room["owner"] != username:
        return emit("error", {"message": "Only owner can accept"})
    for i, p in enumerate(room["pending_changes"]):
        if p["id"] == cid:
            pending = room["pending_changes"].pop(i)
            _apply_op(rid, pending["operation"], pending["author"], pending.get("client_sid"))
            if pending.get("client_sid"):
                emit("change_accepted", {"id": cid}, room=pending["client_sid"])
            return
    emit("error", {"message": "Change not found"})

@socketio.on("reject_change")
def on_reject(data):
    rid, cid, username = data.get("room_id"), data.get("change_id"), data.get("username")
    if rid not in rooms_state:
        return emit("error", {"message": "Room not found"})
    room = rooms_state[rid]
    if room["owner"] != username:
        return emit("error", {"message": "Only owner can reject"})
    for i, p in enumerate(room["pending_changes"]):
        if p["id"] == cid:
            rejected = room["pending_changes"].pop(i)
            if rejected.get("client_sid"):
                emit("change_rejected", {"id": cid, "message": "Rejected by owner"}, room=rejected["client_sid"])
            emit("pending_update", {"pending_count": len(room["pending_changes"])}, room=rid)
            return

@socketio.on("cursor_move")
def on_cursor(data):
    rid, pos, username = data.get("room_id"), data.get("position", 0), data.get("username")
    sid = request.sid
    if rid in rooms_state and sid in rooms_state[rid]["clients"]:
        rooms_state[rid]["clients"][sid]["cursor"] = pos
        emit("remote_cursor", {"username": username, "position": pos, "sid": sid},
             room=rid, include_self=False)

@socketio.on("change_language")
def on_lang(data):
    rid, lang = data.get("room_id"), data.get("language")
    if rid in rooms_state:
        rooms_state[rid]["language"] = lang
        emit("language_changed", {"language": lang}, room=rid)

@socketio.on("change_mode")
def on_mode(data):
    rid, mode = data.get("room_id"), data.get("mode")
    if rid in rooms_state:
        rooms_state[rid]["mode"] = mode
        emit("mode_changed", {"mode": mode}, room=rid)

@socketio.on("toggle_approval")
def on_toggle(data):
    rid, val, username = data.get("room_id"), data.get("require_approval", False), data.get("username")
    if rid in rooms_state and rooms_state[rid]["owner"] == username:
        rooms_state[rid]["require_approval"] = val
        emit("approval_toggled", {"require_approval": val}, room=rid)

# Helpers 

def _apply_op(rid, operation, author, author_sid=None):
    room = rooms_state[rid]
    room["document"] = operation.apply(room["document"])
    room["revision"] += 1
    room["history"].append(operation)
    cursors = {}
    for sid, c in room["clients"].items():
        if sid != author_sid:
            c["cursor"] = operation.transform_cursor(c.get("cursor", 0))
            cursors[sid] = c["cursor"]
    emit("remote_operation", {"operation": operation.to_dict(), "revision": room["revision"],
         "author": author, "cursors": cursors}, room=rid, include_self=False)
    if author_sid:
        emit("ack", {"revision": room["revision"]}, room=author_sid)

def _find_owner_sid(rid):
    room = rooms_state[rid]
    for sid, c in room["clients"].items():
        if c["username"] == room["owner"]:
            return sid
    return None

def _client_list(rid):
    return [{"username": c["username"], "cursor": c.get("cursor", 0)}
            for c in rooms_state[rid]["clients"].values()]

def _describe_op(op):
    ins = sum(len(c["text"]) for c in op.ops if c["type"] == "insert")
    dels = sum(c["count"] for c in op.ops if c["type"] == "delete")
    parts = []
    if ins: parts.append(f"inserted {ins} chars")
    if dels: parts.append(f"deleted {dels} chars")
    return ", ".join(parts) or "no change"

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
