"""
Operational Transformation Engine for Codeflow

Delta-based change tracking with three operation types:
  - retain(n): Skip n characters
  - insert(text): Insert text at current position
  - delete(n): Delete n characters

Supports: apply, transform (convergence), compose (batching),
          invert (undo/reject), and cursor transformation.
"""

import copy


class Operation:
    def __init__(self, ops=None, base_length=0, target_length=0):
        self.ops = ops or []
        self.base_length = base_length
        self.target_length = target_length

    @classmethod
    def from_dict(cls, data):
        op = cls()
        op.ops = data.get("ops", [])
        op.base_length = data.get("base_length", 0)
        op.target_length = data.get("target_length", 0)
        return op

    def to_dict(self):
        return {"ops": self.ops, "base_length": self.base_length, "target_length": self.target_length}

    def retain(self, count):
        if count <= 0: return self
        self.base_length += count
        self.target_length += count
        if self.ops and self.ops[-1]["type"] == "retain":
            self.ops[-1]["count"] += count
        else:
            self.ops.append({"type": "retain", "count": count})
        return self

    def insert(self, text):
        if not text: return self
        self.target_length += len(text)
        if self.ops and self.ops[-1]["type"] == "insert":
            self.ops[-1]["text"] += text
        else:
            self.ops.append({"type": "insert", "text": text})
        return self

    def delete(self, count):
        if count <= 0: return self
        self.base_length += count
        if self.ops and self.ops[-1]["type"] == "delete":
            self.ops[-1]["count"] += count
        else:
            self.ops.append({"type": "delete", "count": count})
        return self

    def apply(self, document):
        if len(document) != self.base_length:
            raise ValueError(f"base_length ({self.base_length}) != doc length ({len(document)})")
        result, idx = [], 0
        for c in self.ops:
            if c["type"] == "retain":
                result.append(document[idx:idx + c["count"]])
                idx += c["count"]
            elif c["type"] == "insert":
                result.append(c["text"])
            elif c["type"] == "delete":
                idx += c["count"]
        return "".join(result)

    def invert(self, document):
        inverse, idx = Operation(), 0
        for c in self.ops:
            if c["type"] == "retain":
                inverse.retain(c["count"])
                idx += c["count"]
            elif c["type"] == "insert":
                inverse.delete(len(c["text"]))
            elif c["type"] == "delete":
                inverse.insert(document[idx:idx + c["count"]])
                idx += c["count"]
        return inverse

    def transform_cursor(self, cursor):
        new_cursor, pos = cursor, 0
        for c in self.ops:
            if c["type"] == "retain":
                pos += c["count"]
            elif c["type"] == "insert":
                tlen = len(c["text"])
                if pos <= cursor:
                    new_cursor += tlen
                pos += tlen
            elif c["type"] == "delete":
                cnt = c["count"]
                if pos < cursor:
                    new_cursor -= min(cnt, cursor - pos)
                pos += cnt
        return max(0, new_cursor)

    def __repr__(self):
        parts = []
        for c in self.ops:
            if c["type"] == "retain": parts.append(f"retain({c['count']})")
            elif c["type"] == "insert": parts.append(f"insert('{c['text']}')")
            elif c["type"] == "delete": parts.append(f"delete({c['count']})")
        return f"Op([{', '.join(parts)}])"


def transform(op_a, op_b):
    """
    Core OT: transform two concurrent operations so they converge.
    apply(apply(doc, A), B') == apply(apply(doc, B), A')
    """
    if op_a.base_length != op_b.base_length:
        raise ValueError(f"Base length mismatch: {op_a.base_length} vs {op_b.base_length}")

    a_prime, b_prime = Operation(), Operation()
    a_iter, b_iter = iter([copy.deepcopy(o) for o in op_a.ops]), iter([copy.deepcopy(o) for o in op_b.ops])
    a, b = next(a_iter, None), next(b_iter, None)

    while a is not None or b is not None:
        if a and a["type"] == "insert":
            a_prime.insert(a["text"]); b_prime.retain(len(a["text"]))
            a = next(a_iter, None); continue
        if b and b["type"] == "insert":
            a_prime.retain(len(b["text"])); b_prime.insert(b["text"])
            b = next(b_iter, None); continue
        if a is None or b is None: break

        if a["type"] == "retain" and b["type"] == "retain":
            m = min(a["count"], b["count"])
            a_prime.retain(m); b_prime.retain(m)
            if a["count"] > b["count"]: a = {"type": "retain", "count": a["count"] - b["count"]}; b = next(b_iter, None)
            elif a["count"] < b["count"]: b = {"type": "retain", "count": b["count"] - a["count"]}; a = next(a_iter, None)
            else: a = next(a_iter, None); b = next(b_iter, None)

        elif a["type"] == "delete" and b["type"] == "retain":
            m = min(a["count"], b["count"])
            a_prime.delete(m)
            if a["count"] > b["count"]: a = {"type": "delete", "count": a["count"] - b["count"]}; b = next(b_iter, None)
            elif a["count"] < b["count"]: b = {"type": "retain", "count": b["count"] - a["count"]}; a = next(a_iter, None)
            else: a = next(a_iter, None); b = next(b_iter, None)

        elif a["type"] == "retain" and b["type"] == "delete":
            m = min(a["count"], b["count"])
            b_prime.delete(m)
            if a["count"] > b["count"]: a = {"type": "retain", "count": a["count"] - b["count"]}; b = next(b_iter, None)
            elif a["count"] < b["count"]: b = {"type": "delete", "count": b["count"] - a["count"]}; a = next(a_iter, None)
            else: a = next(a_iter, None); b = next(b_iter, None)

        elif a["type"] == "delete" and b["type"] == "delete":
            m = min(a["count"], b["count"])
            if a["count"] > b["count"]: a = {"type": "delete", "count": a["count"] - b["count"]}; b = next(b_iter, None)
            elif a["count"] < b["count"]: b = {"type": "delete", "count": b["count"] - a["count"]}; a = next(a_iter, None)
            else: a = next(a_iter, None); b = next(b_iter, None)

    return a_prime, b_prime


def compose(op_a, op_b):
    """Compose sequential operations: apply(doc, compose(A,B)) == apply(apply(doc, A), B)"""
    if op_a.target_length != op_b.base_length:
        raise ValueError("Cannot compose: target != base")
    result = Operation()
    a_iter, b_iter = iter([copy.deepcopy(o) for o in op_a.ops]), iter([copy.deepcopy(o) for o in op_b.ops])
    a, b = next(a_iter, None), next(b_iter, None)

    while a is not None or b is not None:
        if a and a["type"] == "delete":
            result.delete(a["count"]); a = next(a_iter, None); continue
        if b and b["type"] == "insert":
            result.insert(b["text"]); b = next(b_iter, None); continue
        if a is None or b is None: break

        if a["type"] == "retain" and b["type"] == "retain":
            m = min(a["count"], b["count"]); result.retain(m)
            if a["count"] > b["count"]: a = {"type": "retain", "count": a["count"] - b["count"]}; b = next(b_iter, None)
            elif a["count"] < b["count"]: b = {"type": "retain", "count": b["count"] - a["count"]}; a = next(a_iter, None)
            else: a = next(a_iter, None); b = next(b_iter, None)
        elif a["type"] == "insert" and b["type"] == "retain":
            al = len(a["text"]); m = min(al, b["count"]); result.insert(a["text"][:m])
            if al > b["count"]: a = {"type": "insert", "text": a["text"][b["count"]::]}; b = next(b_iter, None)
            elif al < b["count"]: b = {"type": "retain", "count": b["count"] - al}; a = next(a_iter, None)
            else: a = next(a_iter, None); b = next(b_iter, None)
        elif a["type"] == "insert" and b["type"] == "delete":
            al, bc = len(a["text"]), b["count"]; m = min(al, bc)
            if al > bc: a = {"type": "insert", "text": a["text"][bc:]}; b = next(b_iter, None)
            elif al < bc: b = {"type": "delete", "count": bc - al}; a = next(a_iter, None)
            else: a = next(a_iter, None); b = next(b_iter, None)
        elif a["type"] == "retain" and b["type"] == "delete":
            m = min(a["count"], b["count"]); result.delete(m)
            if a["count"] > b["count"]: a = {"type": "retain", "count": a["count"] - b["count"]}; b = next(b_iter, None)
            elif a["count"] < b["count"]: b = {"type": "delete", "count": b["count"] - a["count"]}; a = next(a_iter, None)
            else: a = next(a_iter, None); b = next(b_iter, None)

    return result
