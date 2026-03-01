import { configureStore, createSlice } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

// Editor Slice

const editorSlice = createSlice({
  name: "editor",
  initialState: {
    content: "",
    revision: 0,
    language: "javascript",
    mode: "code",
    roomId: null,
    owner: null,
    username: null,
    isOwner: false,
    requireApproval: false,
    pendingChangesCount: 0,
    clients: [],
    remoteCursors: {},
    connected: false,
    output: { stdout: "", stderr: "", error: null, exit_code: null },
    isExecuting: false,
  },
  reducers: {
    setRoomState: (state, action) => {
      const { document, revision, language, mode, owner, clients, pending_changes_count } = action.payload;
      state.content = document || "";
      state.revision = revision;
      state.language = language;
      state.mode = mode;
      state.owner = owner;
      state.clients = clients;
      state.pendingChangesCount = pending_changes_count || 0;
      state.isOwner = state.username === owner;
      state.connected = true;
    },
    applyLocalOperation: (state, action) => {
      const { content, revision } = action.payload;
      state.content = content;
      state.revision = revision;
    },
    applyRemoteOperation: (state, action) => {
      const { document, revision, cursors } = action.payload;
      state.content = document;
      state.revision = revision;
      if (cursors) state.remoteCursors = { ...state.remoteCursors, ...cursors };
    },
    acknowledgeOperation: (state, action) => {
      state.revision = action.payload.revision;
    },
    setContent: (state, action) => { state.content = action.payload; },
    setDocument: (state, action) => { state.content = action.payload; },
    setLanguage: (state, action) => { state.language = action.payload; },
    setMode: (state, action) => { state.mode = action.payload; },
    setRoomId: (state, action) => { state.roomId = action.payload; },
    setUsername: (state, action) => {
      state.username = action.payload;
      state.isOwner = action.payload === state.owner;
    },
    setRoomInfo: (state, action) => {
      const { roomId, isOwner, username } = action.payload;
      state.roomId = roomId;
      state.isOwner = isOwner;
      state.username = username;
    },
    setConnected: (state, action) => { state.connected = action.payload; },
    setClients: (state, action) => { state.clients = action.payload; },
    setRemoteCursor: (state, action) => {
      const { sid, username, position } = action.payload;
      state.remoteCursors[sid] = { username, position };
    },
    removeRemoteCursor: (state, action) => {
      delete state.remoteCursors[action.payload];
    },
    setPendingCount: (state, action) => { state.pendingChangesCount = action.payload; },
    setRequireApproval: (state, action) => { state.requireApproval = action.payload; },
    setOutput: (state, action) => { state.output = action.payload; state.isExecuting = false; },
    setExecuting: (state, action) => { state.isExecuting = action.payload; },
    setIsExecuting: (state, action) => { state.isExecuting = action.payload; },
    resetEditor: () => ({
      content: "", revision: 0, language: "javascript", mode: "code",
      roomId: null, owner: null, username: null, isOwner: false,
      requireApproval: false, pendingChangesCount: 0, clients: [],
      remoteCursors: {}, connected: false,
      output: { stdout: "", stderr: "", error: null, exit_code: null },
      isExecuting: false,
    }),
  },
});

export const {
  setRoomState, applyLocalOperation, applyRemoteOperation, acknowledgeOperation,
  setContent, setDocument, setLanguage, setMode, setRoomId, setUsername, setRoomInfo,
  setConnected, setClients, setRemoteCursor, removeRemoteCursor, setPendingCount,
  setRequireApproval, setOutput, setExecuting, setIsExecuting, resetEditor,
} = editorSlice.actions;

// Collab Slice 

const collabSlice = createSlice({
  name: "collab",
  initialState: {
    users: [],
    pendingChanges: [],
    connectionStatus: "disconnected",
  },
  reducers: {
    setUsers: (state, action) => { state.users = action.payload; },
    addPendingChange: (state, action) => { state.pendingChanges.push(action.payload); },
    removePendingChange: (state, action) => {
      state.pendingChanges = state.pendingChanges.filter(c => c.id !== action.payload);
    },
    clearPendingChanges: (state) => { state.pendingChanges = []; },
    setConnectionStatus: (state, action) => { state.connectionStatus = action.payload; },
  },
});

export const {
  setUsers, addPendingChange, removePendingChange, clearPendingChanges, setConnectionStatus,
} = collabSlice.actions;

// Redux Persist Config

const persistConfig = {
  key: "codeflow",
  storage,
  whitelist: ["content", "revision", "language", "mode", "roomId", "username"],
};

const persistedReducer = persistReducer(persistConfig, editorSlice.reducer);

// Store

export const store = configureStore({
  reducer: {
    editor: persistedReducer,
    collab: collabSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export default store;
