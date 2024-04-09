/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OmegasheetExtension = void 0;
const vscode = __importStar(__webpack_require__(2));
const spreadsheetEditorProvider_1 = __webpack_require__(3);
const csvEditorProvider_1 = __webpack_require__(9);
const csvDefaultEditorProvider_1 = __webpack_require__(12);
const commands_1 = __webpack_require__(13);
const statusBarItem_1 = __webpack_require__(18);
const constants_1 = __webpack_require__(11);
class OmegasheetExtension {
    context;
    #currentEditor_accessor_storage = {};
    get currentEditor() { return this.#currentEditor_accessor_storage; }
    set currentEditor(value) { this.#currentEditor_accessor_storage = value; }
    #statusBarItem_accessor_storage = null;
    get statusBarItem() { return this.#statusBarItem_accessor_storage; }
    set statusBarItem(value) { this.#statusBarItem_accessor_storage = value; }
    editorProviders = [];
    _spreadsheetStats;
    get spreadsheetStats() { return this._spreadsheetStats; }
    set spreadsheetStats(stats) {
        this._spreadsheetStats = stats;
        this.updateStatusBar();
    }
    constructor(context) {
        this.context = context;
    }
    getConfiguration(uri) {
        return vscode.workspace.getConfiguration('omegasheets', uri);
    }
    getEditorByUri(uri) {
        for (const provider of this.editorProviders) {
            const editor = provider.editors.get(uri.toString());
            if (editor)
                return editor;
        }
        return undefined;
    }
    subscribe() {
        const subscriptions = this.context.subscriptions;
        this.editorProviders.push(spreadsheetEditorProvider_1.SpreadsheetEditorProvider.register(this));
        this.editorProviders.push(csvEditorProvider_1.CsvEditorProvider.register(this));
        this.editorProviders.push(csvDefaultEditorProvider_1.CsvDefaultEditorProvider.register(this));
        (0, commands_1.createCommands)(this).forEach(cmd => subscriptions.push(vscode.commands.registerCommand(cmd.name, () => {
            if (!cmd.viewTypes.includes(this.currentEditor.viewType ?? ''))
                return;
            cmd.exec();
        })));
        subscriptions.push(vscode.window.tabGroups.onDidChangeTabs(() => this.updateCurrentEditor()));
        this.updateCurrentEditor();
    }
    _csvStatusBarItems = new Map();
    _spreadsheetStatusBarItems = new Map();
    disposeSpreadsheetStatusBarItems() {
        if (this._spreadsheetStatusBarItems.size === 0)
            return;
        this._spreadsheetStatusBarItems.forEach(item => item.dispose());
        this._spreadsheetStatusBarItems.clear();
    }
    disposeCsvStatusBarItems() {
        if (this._csvStatusBarItems.size === 0)
            return;
        this._csvStatusBarItems.forEach(item => item.dispose());
        this._csvStatusBarItems.clear();
    }
    updateCsvStatusBarItems() {
        const delimiterItem = this._csvStatusBarItems.get('delimiter') ?? new statusBarItem_1.StatusBarItem(this, 'Delimiter', 'omegasheets.csvDelimiter');
        const headerItem = this._csvStatusBarItems.get('header') ?? new statusBarItem_1.StatusBarItem(this, 'Header', 'omegasheets.csvHeader');
        const editor = this.currentEditor.instance;
        if (editor) {
            const desc = editor.getCsvDescription();
            const header = desc.header ?? false;
            headerItem.value = `$(${header ? 'check' : 'close'})`;
            const delimiter = constants_1.csvDelimiters.find(([delimiter]) => delimiter === desc.delimiter)?.[1] ?? `Custom (${desc.delimiter})`;
            delimiterItem.value = delimiter;
        }
        if (this._csvStatusBarItems.size === 0) {
            this._csvStatusBarItems.set('delimiter', delimiterItem);
            this._csvStatusBarItems.set('header', headerItem);
        }
    }
    updateSpreadsheetStatusBarItems() {
        const sumItem = this._spreadsheetStatusBarItems.get('sum') ?? new statusBarItem_1.StatusBarItem(this, 'Sum', 'omegasheets.copySum');
        const avgItem = this._spreadsheetStatusBarItems.get('avg') ?? new statusBarItem_1.StatusBarItem(this, 'Avg', 'omegasheets.copyAvg');
        const cntItem = this._spreadsheetStatusBarItems.get('cnt') ?? new statusBarItem_1.StatusBarItem(this, 'Cnt', 'omegasheets.copyCnt');
        sumItem.value = this.spreadsheetStats?.find(stat => stat.name === 'sum')?.formattedValue ?? '';
        avgItem.value = this.spreadsheetStats?.find(stat => stat.name === 'avg')?.formattedValue ?? '';
        cntItem.value = this.spreadsheetStats?.find(stat => stat.name === 'cnt')?.formattedValue ?? '';
        if (this._spreadsheetStatusBarItems.size === 0) {
            this._spreadsheetStatusBarItems.set('sum', sumItem);
            this._spreadsheetStatusBarItems.set('avg', avgItem);
            this._spreadsheetStatusBarItems.set('cnt', cntItem);
        }
    }
    updateStatusBar() {
        if (['omegasheets.csv', 'omegasheets.csv-default'].includes(this.currentEditor.viewType ?? '')) {
            this.disposeSpreadsheetStatusBarItems();
            this.updateCsvStatusBarItems();
        }
        else if (['omegasheets.workbook'].includes(this.currentEditor.viewType ?? '')) {
            this.disposeCsvStatusBarItems();
            this.updateSpreadsheetStatusBarItems();
        }
        else {
            this.disposeSpreadsheetStatusBarItems();
            this.disposeCsvStatusBarItems();
        }
    }
    updateCurrentEditor() {
        const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
        this.currentEditor = (tab?.input ?? {});
        this.currentEditor.instance = this.currentEditor.uri ? this.getEditorByUri(this.currentEditor.uri) : undefined;
        console.log(this.currentEditor);
        this.updateStatusBar();
    }
}
exports.OmegasheetExtension = OmegasheetExtension;


/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 3 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SpreadsheetEditorProvider = void 0;
const vscode = __importStar(__webpack_require__(2));
const spreadsheetDocument_1 = __webpack_require__(4);
const spreadsheetEditor_1 = __webpack_require__(5);
const baseEditorProvider_1 = __webpack_require__(8);
class SpreadsheetEditorProvider extends baseEditorProvider_1.BaseEditorProvider {
    static viewType = 'omegasheets.workbook';
    static register(extension) {
        const provider = new SpreadsheetEditorProvider(extension);
        extension.context.subscriptions.push(vscode.window.registerCustomEditorProvider(SpreadsheetEditorProvider.viewType, provider, {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
            supportsMultipleEditorsPerDocument: false,
        }));
        return provider;
    }
    _onDidChangeCustomDocument = new vscode.EventEmitter();
    onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
    async openCustomDocument(uri, openContext, _token) {
        let currentUri = openContext.backupId ? vscode.Uri.parse(openContext.backupId) : uri;
        let content = null;
        try {
            content = await vscode.workspace.fs.readFile(currentUri);
        }
        catch (error) {
            if (currentUri.toString() !== uri.toString()) {
                content = await vscode.workspace.fs.readFile(uri);
            }
        }
        const document = new spreadsheetDocument_1.SpreadsheetDocument(uri, content ?? new Uint8Array());
        const onDidDocumentChange = document.onDidContentChange((e) => {
            this._onDidChangeCustomDocument.fire(e);
        });
        document.onDidDispose(() => {
            onDidDocumentChange.dispose();
        });
        return document;
    }
    async resolveCustomEditor(document, webviewPanel, _token) {
        const editor = this.addEditor(new spreadsheetEditor_1.SpreadsheetEditor(document, webviewPanel.webview, this.extension), document.uri, webviewPanel);
        const editorDisposable = await editor.setupWebview();
        webviewPanel.onDidDispose(() => editorDisposable.dispose());
    }
    async saveCustomDocument(document, _token) {
        await this.editors.get(document.uri.toString())?.updateDocument();
        return document.save();
    }
    saveCustomDocumentAs(document, destination, _token) {
        return document.saveAs(destination);
    }
    revertCustomDocument(document, _token) {
        return document.revert();
    }
    backupCustomDocument(document, context, _token) {
        return document.backup(context.destination);
    }
}
exports.SpreadsheetEditorProvider = SpreadsheetEditorProvider;


/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SpreadsheetDocument = void 0;
const vscode = __importStar(__webpack_require__(2));
class SpreadsheetDocument {
    uri;
    content;
    _onDidContentChange = new vscode.EventEmitter();
    onDidContentChange = this._onDidContentChange.event;
    _onDidDispose = new vscode.EventEmitter();
    onDidDispose = this._onDidDispose.event;
    constructor(uri, content) {
        this.uri = uri;
        this.content = content;
    }
    async revert() {
        this.content = await vscode.workspace.fs.readFile(this.uri);
    }
    async backup(destination) {
        //await this.saveAs(destination);
        return {
            id: destination.toString(),
            delete: async () => {
                try {
                    await vscode.workspace.fs.delete(destination);
                }
                catch (e) { }
            },
        };
    }
    async save() {
        this.saveAs(this.uri);
    }
    async edit(opt) {
        this._onDidContentChange.fire({
            document: this,
            undo: opt.undo,
            redo: opt.redo,
        });
    }
    async saveAs(destination) {
        return vscode.workspace.fs.writeFile(destination, this.content);
    }
    dispose() {
        this._onDidDispose.fire();
        this._onDidContentChange.dispose();
    }
}
exports.SpreadsheetDocument = SpreadsheetDocument;


/***/ }),
/* 5 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SpreadsheetEditor = void 0;
const vscode = __importStar(__webpack_require__(2));
const baseEditor_1 = __webpack_require__(6);
const spreadsheetEditorProvider_1 = __webpack_require__(3);
class SpreadsheetEditor extends baseEditor_1.BaseEditor {
    document;
    webview;
    extension;
    _updateResolution = null;
    get viewType() { return spreadsheetEditorProvider_1.SpreadsheetEditorProvider.viewType; }
    constructor(document, webview, extension) {
        super(webview, extension);
        this.document = document;
        this.webview = webview;
        this.extension = extension;
    }
    _onMessage = (msg) => {
        switch (msg.type) {
            case 'ready':
                this.webview.postMessage({
                    type: 'init',
                    locale: vscode.env.language,
                    body: {
                        content: this.document.content.buffer,
                    }
                });
                break;
            case 'edit':
                this.document.edit({ undo: this.undo, redo: this.redo });
                break;
            case 'update':
                this.document.content = msg.body;
                this._updateResolution?.();
                this._updateResolution = null;
                this._updating = false;
                break;
            case 'error':
                vscode.window.showErrorMessage(msg.content);
                break;
            case 'info':
                vscode.window.showInformationMessage(msg.content);
                break;
            case 'stats':
                this.extension.spreadsheetStats = msg.body;
                break;
        }
    };
    async setupWebview() {
        return super.setupWebview(this._onMessage);
    }
    async updateDocument() {
        if (this._updating)
            return;
        this._updating = true;
        return new Promise(resolve => {
            this.webview.postMessage({ type: 'update' });
            this._updateResolution = resolve;
        });
    }
}
exports.SpreadsheetEditor = SpreadsheetEditor;


/***/ }),
/* 6 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BaseEditor = void 0;
const vscode = __importStar(__webpack_require__(2));
const util_1 = __webpack_require__(7);
class BaseEditor {
    webview;
    extension;
    _updating = false;
    get updating() { return this._updating; }
    _disposables = [];
    get context() { return this.extension.context; }
    constructor(webview, extension) {
        this.webview = webview;
        this.extension = extension;
    }
    getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'webview.js'));
        const iconUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'icons.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'style.css'));
        const nonce = (0, util_1.getNonce)();
        return /* html */ `
			<!DOCTYPE html>
			<html lang='en'>
			<head>
				<meta charset='UTF-8'>
				<meta name='viewport' content='width=device-width, initial-scale=1.0'>
				<title>Omegasheets</title>
				<link href='${styleUri}' rel='stylesheet' />
			</head>
			<body data-type='${this.viewType}'>
				<div id='root'></div>
				<script nonce='${nonce}' src='${iconUri}'></script>
				<script nonce='${nonce}' src='${scriptUri}'></script>
			</body>
			</html>`;
    }
    undo = async () => {
        await this.webview.postMessage({ type: 'undo' });
    };
    redo = async () => {
        await this.webview.postMessage({ type: 'redo' });
    };
    async setupWebview(messageListener) {
        this.webview.options = { enableScripts: true };
        if (messageListener)
            this._disposables.push(this.webview.onDidReceiveMessage(messageListener, this));
        this._disposables.push(vscode.workspace.onDidChangeConfiguration((e) => {
            if (!e.affectsConfiguration('omegasheet.theme'))
                return;
            this.webview.postMessage({ type: 'theme-change', theme: this.getTheme() });
        }, this));
        this._disposables.push(vscode.workspace.onDidChangeConfiguration((e) => {
            if (!e.affectsConfiguration('omegasheet.language'))
                return;
            this.webview.postMessage({ type: 'language-change', langCode: this.getLanguage() });
        }, this));
        this.webview.html = this.getHtmlForWebview(this.webview);
        return new vscode.Disposable(() => {
            this._disposables.forEach(d => d.dispose());
            this._disposables = [];
        });
    }
    getLanguage() {
        return 'en-US';
        // return (
        // 	vscode.workspace.getConfiguration('omegasheet').get('language') ||
        // 	languageMap[vscode.env.language as keyof typeof languageMap]
        // );
    }
    getTheme() {
        return vscode.workspace.getConfiguration('omegasheet').get('theme', 'light');
    }
}
exports.BaseEditor = BaseEditor;


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getNonce = void 0;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
exports.getNonce = getNonce;


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BaseEditorProvider = void 0;
class BaseEditorProvider {
    extension;
    get context() { return this.extension.context; }
    editors = new Map();
    constructor(extension) {
        this.extension = extension;
    }
    addEditor(editor, uri, webviewPanel) {
        const strUri = uri.toString();
        this.editors.set(strUri, editor);
        webviewPanel.onDidDispose(() => this.editors.delete(strUri));
        this.extension.updateCurrentEditor();
        return editor;
    }
}
exports.BaseEditorProvider = BaseEditorProvider;


/***/ }),
/* 9 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CsvEditorProvider = void 0;
const vscode = __importStar(__webpack_require__(2));
const csvEditor_1 = __webpack_require__(10);
const baseEditorProvider_1 = __webpack_require__(8);
class CsvEditorProvider extends baseEditorProvider_1.BaseEditorProvider {
    static viewType = 'omegasheets.csv';
    static register(extension) {
        const provider = new CsvEditorProvider(extension);
        extension.context.subscriptions.push(vscode.window.registerCustomEditorProvider(CsvEditorProvider.viewType, provider, {
            webviewOptions: {
                enableFindWidget: true,
                retainContextWhenHidden: true
            }
        }));
        return provider;
    }
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        const editor = this.addEditor(new csvEditor_1.CsvEditor(document, webviewPanel.webview, this.extension), document.uri, webviewPanel);
        const editorDisposable = await editor.setupWebview();
        webviewPanel.onDidDispose(() => editorDisposable.dispose());
    }
}
exports.CsvEditorProvider = CsvEditorProvider;


/***/ }),
/* 10 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CsvEditor = void 0;
const vscode = __importStar(__webpack_require__(2));
const baseEditor_1 = __webpack_require__(6);
const csvEditorProvider_1 = __webpack_require__(9);
const constants_1 = __webpack_require__(11);
class CsvEditor extends baseEditor_1.BaseEditor {
    document;
    webview;
    extension;
    _updateResolution = null;
    _updating = false;
    _edit;
    _csvDescription;
    get updating() { return this._updating; }
    get viewType() { return csvEditorProvider_1.CsvEditorProvider.viewType; }
    constructor(document, webview, extension) {
        super(webview, extension);
        this.document = document;
        this.webview = webview;
        this.extension = extension;
    }
    getCsvDescription() {
        const conf = this.extension.getConfiguration(this.document.uri);
        const isTsv = this.document.fileName.endsWith('.tsv');
        return Object.assign({}, constants_1.defaultDescription, {
            delimiter: isTsv ? '\t' : conf.get('csvDelimiter'),
            header: conf.get('csvHeader')
        }, this._csvDescription);
    }
    async updateCsvDescription(desc) {
        this._csvDescription = Object.assign({}, this._csvDescription, desc);
        desc = this.getCsvDescription();
        // const conf = this.extension.getConfiguration(this.document.uri);
        // await conf.update('csvDelimiter', desc.delimiter, vscode.ConfigurationTarget.Workspace);
        // await conf.update('csvHeader', desc.header, vscode.ConfigurationTarget.Workspace);
        this.updateDocument();
        this.extension.updateStatusBar();
    }
    startEdit(data) {
        this._edit = this._edit ?? new vscode.WorkspaceEdit();
        if (data.updatedRows) {
            data.updatedRows.forEach(([row, content]) => {
                const range = this.document.lineAt(row).range;
                this._edit?.replace(this.document.uri, range, content);
            });
        }
        if (data.deletedRows) {
            data.deletedRows.forEach(row => {
                let range = this.document.lineAt(row).rangeIncludingLineBreak;
                this._edit?.delete(this.document.uri, range);
            });
        }
        if (data.insertedRows) {
            data.insertedRows.forEach(([row, content]) => {
                const range = this.document.lineAt(row).range;
                this._edit?.insert(this.document.uri, range.start, content + '\n');
            });
        }
        if (data.content) {
            this._edit?.replace(this.document.uri, new vscode.Range(0, 0, this.document.lineCount, 0), data.content);
        }
    }
    async endEdit() {
        if (!this._edit)
            return;
        await vscode.workspace.applyEdit(this._edit);
        this._edit = undefined;
    }
    _onMessage = (msg) => {
        switch (msg.type) {
            case 'ready':
                this.updateDocument();
                break;
            case 'edit':
                this.startEdit(msg.body);
                this.endEdit();
                break;
            case 'update':
                this.updateDocument();
                break;
            case 'error':
                vscode.window.showErrorMessage(msg.content);
                break;
            case 'info':
                vscode.window.showInformationMessage(msg.content);
                break;
        }
    };
    async updateDocument() {
        this.webview.postMessage({
            type: 'init',
            locale: vscode.env.language,
            body: {
                content: this.document.getText(),
                description: this.getCsvDescription()
            }
        });
    }
    async setupWebview() {
        return super.setupWebview(this._onMessage);
    }
}
exports.CsvEditor = CsvEditor;


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.csvDelimiters = exports.defaultDescription = void 0;
exports.defaultDescription = {
    header: true,
    delimiter: ',',
    quote: '"',
};
exports.csvDelimiters = [
    [',', 'Comma'],
    [';', 'Semicolon'],
    ['\t', 'Tab'],
    [' ', 'Space'],
    ['|', 'Pipe'],
];


/***/ }),
/* 12 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CsvDefaultEditorProvider = void 0;
const vscode = __importStar(__webpack_require__(2));
const csvEditor_1 = __webpack_require__(10);
const baseEditorProvider_1 = __webpack_require__(8);
class CsvDefaultEditorProvider extends baseEditorProvider_1.BaseEditorProvider {
    static viewType = 'omegasheets.csv-default';
    static register(extension) {
        const provider = new CsvDefaultEditorProvider(extension);
        extension.context.subscriptions.push(vscode.window.registerCustomEditorProvider(CsvDefaultEditorProvider.viewType, provider, {
            webviewOptions: {
                enableFindWidget: true,
                retainContextWhenHidden: true
            }
        }));
        return provider;
    }
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        const editor = this.addEditor(new csvEditor_1.CsvEditor(document, webviewPanel.webview, this.extension), document.uri, webviewPanel);
        const editorDisposable = await editor.setupWebview();
        webviewPanel.onDidDispose(() => editorDisposable.dispose());
    }
}
exports.CsvDefaultEditorProvider = CsvDefaultEditorProvider;


/***/ }),
/* 13 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createCommands = void 0;
const csvDelimiterQuickPick_1 = __webpack_require__(14);
const csvHeaderQuickPick_1 = __webpack_require__(17);
const vscode = __importStar(__webpack_require__(2));
function getStatValue(extension, type) {
    const value = extension.spreadsheetStats?.find(stat => stat.name === type)?.value ?? '';
    return value.toString();
}
const createCommands = (extension) => ([{
        name: 'omegasheets.csvHeader',
        viewTypes: ['omegasheets.csv', 'omegasheets.csv-default'],
        exec: async () => {
            if (!['omegasheets.csv', 'omegasheets.csv-default'].includes(extension.currentEditor.viewType ?? ''))
                return;
            const editor = extension.currentEditor.instance;
            if (!editor)
                return;
            const qp = new csvHeaderQuickPick_1.CsvHeaderQuickPick(extension);
            const header = await qp.show(editor.getCsvDescription().header ?? false);
            if (header === undefined)
                return;
            editor.updateCsvDescription({ header });
        }
    }, {
        name: 'omegasheets.csvDelimiter',
        viewTypes: ['omegasheets.csv', 'omegasheets.csv-default'],
        exec: async () => {
            if (!['omegasheets.csv', 'omegasheets.csv-default'].includes(extension.currentEditor.viewType ?? ''))
                return;
            const editor = extension.currentEditor.instance;
            if (!editor)
                return;
            const qp = new csvDelimiterQuickPick_1.CsvDelimiterQuickPick(extension);
            const delimiter = await qp.show(editor.getCsvDescription().delimiter ?? ',');
            if (delimiter === undefined)
                return;
            editor.updateCsvDescription({ delimiter: delimiter });
        }
    }, {
        name: 'omegasheets.copySum',
        viewTypes: ['omegasheets.workbook'],
        exec: async () => {
            await vscode.env.clipboard.writeText(getStatValue(extension, 'sum'));
            vscode.window.showInformationMessage('Sum value saved to clipboard.');
        }
    }, {
        name: 'omegasheets.copyAvg',
        viewTypes: ['omegasheets.workbook'],
        exec: async () => {
            await vscode.env.clipboard.writeText(getStatValue(extension, 'avg'));
            vscode.window.showInformationMessage('Average value saved to clipboard.');
        }
    }, {
        name: 'omegasheets.copyCnt',
        viewTypes: ['omegasheets.workbook'],
        exec: async () => {
            await vscode.env.clipboard.writeText(getStatValue(extension, 'cnt'));
            vscode.window.showInformationMessage('Count value saved to clipboard.');
        }
    }]);
exports.createCommands = createCommands;


/***/ }),
/* 14 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CsvDelimiterQuickPick = void 0;
const vscode = __importStar(__webpack_require__(2));
const baseQuickPick_1 = __webpack_require__(15);
const constants_1 = __webpack_require__(11);
class CsvDelimiterQuickPick extends baseQuickPick_1.BaseQuickPick {
    currentDelimiter;
    menu;
    async show(defaultValue) {
        return new Promise((resolve) => {
            this.menu = vscode.window.createQuickPick();
            this.menu.title = 'CSV Delimiter';
            this.menu.placeholder = 'Select the delimiter used in the CSV file.';
            this.menu.items = [...constants_1.csvDelimiters.map(([delimiter, label]) => ({
                    label: `${label}${delimiter.trim() === '' ? '' : ` ( ${delimiter} )`}`,
                    value: delimiter
                })), {
                    label: 'Custom',
                    value: 'custom'
                }];
            this.menu.onDidChangeActive((e) => this.currentDelimiter = e[0].value);
            this.menu.onDidAccept(async (e) => {
                this.menu?.hide();
                if (this.currentDelimiter === 'custom') {
                    this.currentDelimiter = await vscode.window.showInputBox({
                        title: 'Custom Delimiter',
                        placeHolder: 'Enter the custom delimiter used in the CSV file.'
                    });
                }
                resolve(this.currentDelimiter);
            });
            this.menu.show();
        });
    }
    dispose() {
        this.menu?.dispose();
        this.menu = undefined;
    }
}
exports.CsvDelimiterQuickPick = CsvDelimiterQuickPick;


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BaseQuickPick = void 0;
const baseComponent_1 = __webpack_require__(16);
class BaseQuickPick extends baseComponent_1.BaseComponent {
}
exports.BaseQuickPick = BaseQuickPick;


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BaseComponent = void 0;
class BaseComponent {
    extension;
    constructor(extension) {
        this.extension = extension;
    }
}
exports.BaseComponent = BaseComponent;


/***/ }),
/* 17 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CsvHeaderQuickPick = void 0;
const vscode = __importStar(__webpack_require__(2));
const baseQuickPick_1 = __webpack_require__(15);
class CsvHeaderQuickPick extends baseQuickPick_1.BaseQuickPick {
    async show(defaultValue) {
        const item = await vscode.window.showQuickPick([
            { label: `Yes`, value: true, picked: defaultValue === true },
            { label: `No`, value: false, picked: defaultValue === false }
        ], {
            title: 'CSV Header',
            placeHolder: 'Select whether the CSV file has a header row.'
        });
        return item?.value ?? false;
    }
    dispose() { }
}
exports.CsvHeaderQuickPick = CsvHeaderQuickPick;


/***/ }),
/* 18 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StatusBarItem = void 0;
const vscode = __importStar(__webpack_require__(2));
class StatusBarItem {
    extension;
    command;
    get context() { return this.extension.context; }
    _item;
    get item() { return this._item ?? (this._item = this.createItem()); }
    _name;
    get name() { return this._name; }
    set name(value) {
        this._name = value;
        this.update();
    }
    _value;
    get value() { return this._value; }
    set value(value) {
        this._value = value;
        this.update();
    }
    constructor(extension, name, command) {
        this.extension = extension;
        this.command = command;
        this.name = name;
    }
    createItem() {
        const subscriptions = this.context.subscriptions;
        const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        item.command = this.command;
        subscriptions.push(item);
        return item;
    }
    update() {
        if (this.value !== null && this.value !== undefined && this.value !== '') {
            this.item.text = `${this.name}: ${this.value}`;
            this.item.show();
        }
        else {
            this.item.hide();
        }
    }
    dispose() {
        this.item?.dispose();
    }
}
exports.StatusBarItem = StatusBarItem;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = void 0;
const extension_1 = __webpack_require__(1);
function activate(context) {
    const extension = new extension_1.OmegasheetExtension(context);
    extension.subscribe();
}
exports.activate = activate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map