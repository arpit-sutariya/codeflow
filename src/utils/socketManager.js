import { io } from "socket.io-client";
import store, {
  setRoomState, applyRemoteOperation, acknowledgeOperation,
  setConnected, setClients, setRemoteCursor,
  setPendingCount, setRequireApproval, setMode, setLanguage,
  setUsers, addPendingChange, removePendingChange, setConnectionStatus,
} from "../store/store";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:8000";

class SocketManager {
  constructor() {
    this.socket = null;
    this.pendingOp = null;
    this.bufferOp = null;
    this.revision = 0;
    this.onContentUpdate = null;
  }

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      store.dispatch(setConnected(true));
      store.dispatch(setConnectionStatus("connected"));
      this._rejoinRoom();
    });

    this.socket.on("disconnect", () => {
      store.dispatch(setConnected(false));
      store.dispatch(setConnectionStatus("disconnected"));
    });

    this.socket.on("reconnecting", () => {
      store.dispatch(setConnectionStatus("reconnecting"));
    });

    this.socket.on("room_state", (data) => {
      this.revision = data.revision;
      store.dispatch(setRoomState(data));
      const clients = data.clients || [];
      store.dispatch(setUsers(clients));
    });

    this.socket.on("user_joined", (data) => {
      store.dispatch(setClients(data.clients));
      store.dispatch(setUsers(data.clients));
    });

    this.socket.on("user_left", (data) => {
      store.dispatch(setClients(data.clients));
      store.dispatch(setUsers(data.clients));
    });

    this.socket.on("ack", (data) => {
      this.revision = data.revision;
      store.dispatch(acknowledgeOperation({ revision: data.revision }));
      if (this.bufferOp) {
        this.pendingOp = this.bufferOp;
        this.bufferOp = null;
        this._sendOperation(this.pendingOp);
      } else {
        this.pendingOp = null;
      }
    });

    this.socket.on("remote_operation", (data) => {
      const remoteOp = data.operation;
      this.revision = data.revision;
      const state = store.getState().editor;
      const newDoc = this._applyOp(state.content, remoteOp);
      if (this.onContentUpdate) this.onContentUpdate(newDoc);
      store.dispatch(applyRemoteOperation({
        document: newDoc,
        revision: data.revision,
        cursors: data.cursors,
      }));
    });

    this.socket.on("remote_cursor", (data) => {
      store.dispatch(setRemoteCursor(data));
    });

    this.socket.on("change_pending", (data) => {
      console.log("Change pending:", data.message);
    });

    this.socket.on("change_accepted", (data) => {
      store.dispatch(removePendingChange(data.id));
    });

    this.socket.on("change_rejected", (data) => {
      store.dispatch(removePendingChange(data.id));
    });

    this.socket.on("new_pending_change", (data) => {
      store.dispatch(setPendingCount(data.pending_count));
      store.dispatch(addPendingChange({
        id: data.id,
        author: data.author,
        description: data.description,
        timestamp: Date.now() / 1000,
      }));
    });

    this.socket.on("pending_update", (data) => {
      store.dispatch(setPendingCount(data.pending_count));
    });

    this.socket.on("approval_toggled", (data) => {
      store.dispatch(setRequireApproval(data.require_approval));
    });

    this.socket.on("language_changed", (data) => {
      store.dispatch(setLanguage(data.language));
    });

    this.socket.on("mode_changed", (data) => {
      store.dispatch(setMode(data.mode));
    });

    this.socket.on("error", (data) => {
      console.error("Server error:", data.message);
    });

    return this.socket;
  }

  async createRoom(roomId, username) {
    try {
      await fetch(`${SERVER_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, username }),
      });
    } catch (e) {
      console.error("Failed to create room:", e);
    }
    if (this.socket?.connected) {
      this.joinRoom(roomId, username);
    } else {
      this.socket?.once("connect", () => this.joinRoom(roomId, username));
    }
  }

  joinRoom(roomId, username) {
    this.socket?.emit("join_room", { room_id: roomId, username });
  }

  _rejoinRoom() {
    const state = store.getState().editor;
    if (state.roomId && state.username) {
      this.joinRoom(state.roomId, state.username);
    }
  }

  sendOperation(operation) {
    if (!this.pendingOp) {
      this.pendingOp = operation;
      this._sendOperation(operation);
    } else if (!this.bufferOp) {
      this.bufferOp = operation;
    } else {
      this.bufferOp = this._composeOps(this.bufferOp, operation);
    }
  }

  _sendOperation(operation) {
    const state = store.getState().editor;
    this.socket?.emit("operation", {
      room_id: state.roomId,
      revision: this.revision,
      operation: operation,
      username: state.username,
    });
  }

  sendCursorPosition(position) {
    const state = store.getState().editor;
    this.socket?.emit("cursor_move", {
      room_id: state.roomId,
      position,
      username: state.username,
    });
  }

  sendCursorMove(position) {
    this.sendCursorPosition(position);
  }

  acceptChange(changeId) {
    const state = store.getState().editor;
    this.socket?.emit("accept_change", {
      room_id: state.roomId, change_id: changeId, username: state.username,
    });
    store.dispatch(removePendingChange(changeId));
  }

  rejectChange(changeId) {
    const state = store.getState().editor;
    this.socket?.emit("reject_change", {
      room_id: state.roomId, change_id: changeId, username: state.username,
    });
    store.dispatch(removePendingChange(changeId));
  }

  toggleApproval(requireApproval) {
    const state = store.getState().editor;
    this.socket?.emit("toggle_approval", {
      room_id: state.roomId, require_approval: requireApproval, username: state.username,
    });
  }

  changeLanguage(language) {
    const state = store.getState().editor;
    this.socket?.emit("change_language", { room_id: state.roomId, language });
  }

  changeMode(mode) {
    const state = store.getState().editor;
    this.socket?.emit("change_mode", { room_id: state.roomId, mode });
  }

  _applyOp(document, opData) {
    let idx = 0;
    const parts = [];
    for (const c of opData.ops) {
      if (c.type === "retain") {
        parts.push(document.substring(idx, idx + c.count));
        idx += c.count;
      } else if (c.type === "insert") {
        parts.push(c.text);
      } else if (c.type === "delete") {
        idx += c.count;
      }
    }
    return parts.join("");
  }

  _composeOps(a, b) {
    return b;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

const socketManager = new SocketManager();
export default socketManager;
