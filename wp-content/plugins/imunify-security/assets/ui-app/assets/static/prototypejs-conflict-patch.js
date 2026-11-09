// Plesk's prototype.js breaks Array.from (ignores mapFn) and Array#find, and deletes Array#entries.
(function () {
    function restore(target, key, value) {
        Object.defineProperty(target, key, {value: value, writable: true, configurable: true});
    }

    if (typeof [].entries !== 'function') {
        // Our BaseController deletes it too; WebIDL makes NodeList#entries this realm's own.
        restore(Array.prototype, 'entries', NodeList.prototype.entries);
    }

    var fromWorks = Array.from({length: 1}, function () { return 1; })[0] === 1;
    var findWorks;
    try {
        findWorks = Array.prototype.find.call({length: 1, 0: 1}, Boolean) === 1;
    } catch (e) {
        findWorks = false;
    }
    if (fromWorks && findWorks) {
        return;
    }
    var frame = document.createElement('iframe');
    frame.style.display = 'none';
    document.body.appendChild(frame);
    var pristine = frame.contentWindow.Array;
    if (!fromWorks) {
        restore(Array, 'from', pristine.from);
    }
    if (!findWorks) {
        restore(Array.prototype, 'find', pristine.prototype.find);
    }
    document.body.removeChild(frame);
})();
