exports.id = 1;
exports.ids = [1];
exports.modules = {

/***/ 129:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fileFromPath: () => (/* binding */ fileFromPath),
/* harmony export */   fileFromPathSync: () => (/* binding */ fileFromPathSync),
/* harmony export */   isFile: () => (/* reexport safe */ _isFile_js__WEBPACK_IMPORTED_MODULE_5__.isFile)
/* harmony export */ });
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(130);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var node_domexception__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(131);
/* harmony import */ var _File_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(28);
/* harmony import */ var _isPlainObject_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(133);
/* harmony import */ var _isFile_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(33);
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _FileFromPath_path, _FileFromPath_start;






const MESSAGE = "The requested file could not be read, "
    + "typically due to permission problems that have occurred after a reference "
    + "to a file was acquired.";
class FileFromPath {
    constructor(input) {
        _FileFromPath_path.set(this, void 0);
        _FileFromPath_start.set(this, void 0);
        __classPrivateFieldSet(this, _FileFromPath_path, input.path, "f");
        __classPrivateFieldSet(this, _FileFromPath_start, input.start || 0, "f");
        this.name = (0,path__WEBPACK_IMPORTED_MODULE_1__.basename)(__classPrivateFieldGet(this, _FileFromPath_path, "f"));
        this.size = input.size;
        this.lastModified = input.lastModified;
    }
    slice(start, end) {
        return new FileFromPath({
            path: __classPrivateFieldGet(this, _FileFromPath_path, "f"),
            lastModified: this.lastModified,
            size: end - start,
            start
        });
    }
    async *stream() {
        const { mtimeMs } = await fs__WEBPACK_IMPORTED_MODULE_0__.promises.stat(__classPrivateFieldGet(this, _FileFromPath_path, "f"));
        if (mtimeMs > this.lastModified) {
            throw new node_domexception__WEBPACK_IMPORTED_MODULE_2__(MESSAGE, "NotReadableError");
        }
        if (this.size) {
            yield* (0,fs__WEBPACK_IMPORTED_MODULE_0__.createReadStream)(__classPrivateFieldGet(this, _FileFromPath_path, "f"), {
                start: __classPrivateFieldGet(this, _FileFromPath_start, "f"),
                end: __classPrivateFieldGet(this, _FileFromPath_start, "f") + this.size - 1
            });
        }
    }
    get [(_FileFromPath_path = new WeakMap(), _FileFromPath_start = new WeakMap(), Symbol.toStringTag)]() {
        return "File";
    }
}
function createFileFromPath(path, { mtimeMs, size }, filenameOrOptions, options = {}) {
    let filename;
    if ((0,_isPlainObject_js__WEBPACK_IMPORTED_MODULE_4__["default"])(filenameOrOptions)) {
        [options, filename] = [filenameOrOptions, undefined];
    }
    else {
        filename = filenameOrOptions;
    }
    const file = new FileFromPath({ path, size, lastModified: mtimeMs });
    if (!filename) {
        filename = file.name;
    }
    return new _File_js__WEBPACK_IMPORTED_MODULE_3__.File([file], filename, {
        ...options, lastModified: file.lastModified
    });
}
function fileFromPathSync(path, filenameOrOptions, options = {}) {
    const stats = (0,fs__WEBPACK_IMPORTED_MODULE_0__.statSync)(path);
    return createFileFromPath(path, stats, filenameOrOptions, options);
}
async function fileFromPath(path, filenameOrOptions, options) {
    const stats = await fs__WEBPACK_IMPORTED_MODULE_0__.promises.stat(path);
    return createFileFromPath(path, stats, filenameOrOptions, options);
}


/***/ }),

/***/ 131:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*! node-domexception. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */

if (!globalThis.DOMException) {
  try {
    const { MessageChannel } = __webpack_require__(132),
    port = new MessageChannel().port1,
    ab = new ArrayBuffer()
    port.postMessage(ab, [ab, ab])
  } catch (err) {
    err.constructor.name === 'DOMException' && (
      globalThis.DOMException = err.constructor
    )
  }
}

module.exports = globalThis.DOMException


/***/ }),

/***/ 133:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const getType = (value) => (Object.prototype.toString.call(value).slice(8, -1).toLowerCase());
function isPlainObject(value) {
    if (getType(value) !== "object") {
        return false;
    }
    const pp = Object.getPrototypeOf(value);
    if (pp === null || pp === undefined) {
        return true;
    }
    const Ctor = pp.constructor && pp.constructor.toString();
    return Ctor === Object.toString();
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (isPlainObject);


/***/ })

};
;
//# sourceMappingURL=1.extension.js.map