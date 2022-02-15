class Keyboard {

    #container;
    #langs;
    #lang;
    #altLang;
    #layouts;
    #layout;
    #width = 40;
    #height = 40;
    #assignments;
    #keyIdPrefix = 'key-';

    /**
     * Constructs the keyboard DOM
     * 
     * @param container {HTMLElement}
     * @param layout {KeyBoardLayout}
     * @param lang {string} lang code (lang to use)
     * @param altLang {string} lang code (fallback lang)
     * @param width {string} the default width in px
     * @param height {string} the default height in px
     */
    constructor(container, langs, lang, altLang, layouts, assignments) {
        this.#container = container;
        this.#langs = langs;
        this.#lang = lang;
        this.#altLang = altLang;
        this.#layouts = layouts;
        this.#layout = layouts[Object.keys(layouts)[0]];
        this.#assignments = assignments;

        this.#createDOM();
        this.#createListener();

    }

    /**
     * Changes the current language.
     * 
     * @param {string} lang - The language to use 
     * @param {string} altLang - The alternative language to use
     * @throws {Error} - When the language is not supported 
     */
    setLang(lang, altLang = this.#altLang) {
        if (this.#langs.length == 0 || !this.#langs.includes(lang) || !this.#langs.includes(altLang)) throw new Error('lang(s) not available');
        this.#lang = lang;
        this.#altLang = altLang;

        this.#reload();
    }

    #reload() {
        this.#container.innerText = '';
        this.#createDOM();
        this.#createListener();
    }

    #createDOM() {
        const assignmentList = [];
        const createAssignment = (context, position, key) => {
            const mapping = this.#layout.mappings[key];
            const assignment = document.createElement('div');
            assignment.id = this.#keyIdPrefix + key;
            const headline = document.createElement('h2');
            headline.innerText = mapping.length == 1 ? `${mapping[0]}` : `${mapping[0]} - ${mapping[1][this.#lang] || mapping[1][this.#altLang]}`;
            assignment.append(headline);
            Object.keys(this.#assignments[key]).forEach((scope, i) => {
                const section = document.createElement('div');
                const subline = document.createElement('h3');
                subline.innerText = scope;
                section.append(subline);
                const description = document.createElement('p');
                description.innerText = this.#assignments[key][scope][0];
                section.append(description);
                const tags = document.createElement('div');
                this.#assignments[key][scope][1].forEach((tag, j) => {
                    const tagEl = document.createElement('span');
                    tagEl.innerText = tag;
                    tags.append(tagEl);
                });
                section.append(tags);
                assignment.append(section);
            });
            assignmentList.push(assignment);
        }
        const createKey = (context, position, key, margin) => {
            let el = document.createElement('div');
            let style = '';
            if (margin != 0) style += `margin-left: ${margin * this.#width}px;`;
            if (typeof key === 'number') {
                el.setAttribute('data-kbd-key', key);
                el.innerHTML = `<span>${this.#layout.mappings[key][0]}</span>`;
                if (!this.#layout.mappings[key][1]) {
                    el.title = this.#layout.mappings[key][0];
                } else if (typeof this.#layout.mappings[key][1] === 'object') {
                    el.title = this.#layout.mappings[key][1][this.#lang] || this.#layout.mappings[key][1][this.#altLang] || this.#layout.mappings[key][0];
                } else {
                    throw `unknown mappings @ mappings:${key} @ layout:${context}:${position}`;
                }
                if (typeof this.#assignments[key] === 'object') {
                    el.classList.add('assigned', 'clickable');
                    el.onclick = (e) => {
                        e.preventDefault();
                        this.#scrollToKey(key);
                    };
                    createAssignment(`${context}-assignment`, position, key);
                }
            } else {
                el.setAttribute('data-kbd-key', key.key);
                if (typeof key.width === 'number') style += `width: ${key.width * this.#width}px;`;
                if (typeof key.height === 'number') style += `height: ${key.height * this.#height}px;`;
                el.innerHTML = `<span>${this.#layout.mappings[key.key][0]}</span>`;
                if (!this.#layout.mappings[key.key][1]) {
                    el.title = this.#layout.mappings[key.key][0];
                } else if (typeof this.#layout.mappings[key.key][1] === 'object') {
                    el.title = this.#layout.mappings[key.key][1][this.#lang] || this.#layout.mappings[key.key][1][this.#altLang] || this.#layout.mappings[key.key][0];
                } else {
                    throw `unknown mappings @ mappings:${key.key} @ layout:${context}:${position}`;
                }
                if (typeof this.#assignments[key.key] === 'object') {
                    el.classList.add('assigned', 'clickable');
                    el.onclick = (e) => {
                        e.preventDefault();
                        this.#scrollToKey(key.key);
                    };
                    createAssignment(`${context}-assignment`, position, key.key);
                }
            }
            el.style = style;
            return el;
        };
        const keyboard = document.createElement('div');
        keyboard.classList.add('kbd');
        const fun = document.createElement('div');
        fun.style = `margin-bottom: ${this.#height * this.#layout.layout.partMargin}px;`;
        fun.classList.add('fun');
        let margin = 0;
        this.#layout.layout.fun.forEach((key, i) => {
            if (key === null) {
                margin++;
            } else if (!key.key && !key.height && key.width) {
                margin += key.width;
            } else if (typeof key === 'number' || (typeof key === 'object' && key.key && (key.height || key.width))) {
                fun.append(createKey('fun', i, key, margin));
                margin = 0;
            } else {
                throw `unknown key @ layout:fun:${i}`;
            }
        });
        const desc = document.createElement('a');
        desc.setAttribute('data-id', 'keyboard-layout-selector-a');
        desc.classList.add('clickable');
        desc.style = `margin-left: ${this.#width * this.#layout.layout.partMargin}px;`;
        desc.classList.add('desc');
        desc.innerText = this.#layout.layout.name[this.#lang] || this.#layout.layout.name[this.#altLang];
        fun.append(desc);
        keyboard.append(fun);
        const main = document.createElement('div');
        main.style = `margin-right: ${this.#width * this.#layout.layout.partMargin}px;`;
        main.classList.add('main');
        margin = 0;
        this.#layout.layout.main.forEach((row, i) => {
            const mainRow = document.createElement('div');
            row.forEach((key, j) => {
                if (key === null) {
                    margin++;
                } else if (!key.key && !key.height && key.width) {
                    margin += key.width;
                } else if (typeof key === 'number' || (typeof key === 'object' && key.key && (key.height || key.width))) {
                    mainRow.append(createKey('fun', i, key, margin));
                    margin = 0;
                } else {
                    throw `unknown key @ layout:fun:${i}`;
                }
            });
            main.append(mainRow);
        });
        keyboard.append(main);
        const right = document.createElement('div');
        right.classList.add('right');
        margin = 0;
        this.#layout.layout.right.forEach((row, i) => {
            const rightRow = document.createElement('div');
            row.forEach((key, j) => {
                if (key === null) {
                    margin++;
                } else if (!key.key && !key.height && key.width) {
                    margin += key.width;
                } else if (typeof key === 'number' || (typeof key === 'object' && key.key && (key.height || key.width))) {
                    rightRow.append(createKey('fun', i, key, margin));
                    margin = 0;
                } else {
                    throw `unknown key @ layout:fun:${i}`;
                }
            });
            right.append(rightRow);
        });
        keyboard.append(right);
        const layoutSelector = document.createElement('div');
        layoutSelector.setAttribute('data-id', 'keyboard-layout-selector-p');
        layoutSelector.classList.add('popup');
        const list = document.createElement('ul');
        Object.keys(this.#layouts).forEach((k) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.classList.add('clickable');
            a.innerText = this.#layouts[k].layout.name[this.#lang] || this.#layouts[k].layout.name[this.#altLang];
            a.onclick = (e) => {
                e.preventDefault();
                this.#setKeyboard(this.#layouts[k]);
            }
            li.append(a);
            list.append(li);
        });
        layoutSelector.append(list);
        keyboard.append(layoutSelector);
        this.#container.append(keyboard);
        const assignments = document.createElement('div');
        assignments.classList.add('kbd-list');
        assignmentList.forEach((assignment) => {
            assignments.append(assignment);
        });
        this.#container.append(assignments);
    }

    #createListener() {
        document.onkeydown = (e) => {
            e.preventDefault();
            this.#container.querySelector(`[data-kbd-key="${e.keyCode}"]`).classList.add('active');
        };
        document.onkeyup = (e) => {
            e.preventDefault();
            this.#container.querySelector(`[data-kbd-key="${e.keyCode}"]`).classList.remove('active');
            if (typeof this.#assignments[e.keyCode] === 'object') this.#scrollToKey(e.keyCode);
        };
        document.querySelector('[data-id=keyboard-layout-selector-a]').onclick = this.toggleLayoutSelector;
    }

    toggleLayoutSelector(e) {
        e.preventDefault();
        let el = document.querySelector('[data-id=keyboard-layout-selector-p]');
        el.classList[el.classList.contains('visible') ? 'remove' : 'add']('visible');
    }

    #setKeyboard(layout) {
        this.#layout = layout;
        this.#reload();
    }

    #scrollToKey(id) {
        id = this.#keyIdPrefix + id;
        document.getElementById(id)
            .scrollIntoView({behavior: 'smooth'});
    }
}

class UI {
    static #notifications = {
        e00: {
            de_DE: 'Fehler: Konnte Tastenzuweisungen nicht laden.',
            en_US: 'Error: Couldn\'t load key assignments.', 
        }
    }
    static get notifications() {
        return this.#notifications;
    }

    #langs;
    #lang;
    #altLang;
    #classes;
    #html = {
        elements: null,
        translations: {
            footer: {
                en_US: 'Colors thankfully stolen from <a href="https://holzmaster.github.io/userscripts/eckdaten">Holzmaster @ GitHub » Userscripts » Key Data</a>.',
                de_DE: 'Farben dankend von <a href="https://holzmaster.github.io/userscripts/eckdaten">Holzmaster @ GitHub » Userscripts » Eckdaten</a> geklaut.',
            }
        }
    }
    
    constructor(langs, lang, altLang, html) {
        this.#langs = langs;
        this.#lang = lang;
        this.#altLang = altLang;
        this.#classes = [];
        this.#html.elements = html;

        this.#applyLang();
    }

    addClass(clazz) {
        this.#classes.push(clazz);
    }

    /**
     * Changes the current language.
     * 
     * @param {string} lang - The language to use 
     * @param {string} altLang - The alternative language to use
     * @throws {Error} - When the language is not supported 
     */
    setLang(lang, altLang = this.#altLang) {
        if (this.#langs.length == 0 || !this.#langs.includes(lang) || !this.#langs.includes(altLang)) throw new Error('lang(s) not available');
        this.#lang = lang;
        this.#altLang = altLang;
        this.#classes.forEach((c) => {
            c.setLang(lang, altLang);
        });
        this.#applyLang();
    }

    notify(str) {
        console.log(str[this.#lang || this.#altLang]);
        alert(str[this.#lang || this.#altLang]);
    }

    #applyLang() {
        Object.keys(this.#html.elements).forEach((key) => {
            this.#html.elements[key].innerHTML = this.#html.translations[key][this.#lang] || this.#html.translations[key][this.#altLang];
        })
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    function parseLayouts(e) {
        const href = e.getAttribute('href').split(',');
        return e.getAttribute('content').split(',').map(it => href[0] + it + href[1]);
    }
    async function getJSON(files) {
        let json = {};
        if (files instanceof Array) {
            for (let file of files) {
                await fetch(file).then(async (response) => {
                    if (response.ok) {
                        json[file] = await response.json();
                    } else {
                        ui.notify(UI.notifications.e00);
                    }
                }).catch((e) => {
                    ui.notify(UI.notifications.e00);
                });
            }
        } else if (typeof files === 'string') {
            await fetch(files).then(async (response) => {
                if (response.ok) {
                    json = await response.json();
                } else {
                    ui.notify(UI.notifications.e00);
                }
            }).catch((e) => {
                ui.notify(UI.notifications.e00);
            });
        }
        return json;
    }

    const langs = document.querySelector('meta[name=kbd-langs]').getAttribute('content').split(',');
    const layouts = await getJSON(parseLayouts(document.querySelector('meta[name=kbd-layouts]')));
    const assignments = await getJSON(document.querySelector('meta[name=kbd-assignments]').getAttribute('href'));

    const ui = new UI(langs, langs[0], langs[1], {footer: document.querySelector('[data-id=footer]')});

    const langSelect = document.querySelector('[data-id=lang-select]');
    langs.forEach((lang, i) => {
        const option = document.createElement('option');
        option.value = lang;
        option.innerText = lang;
        langSelect.append(option);
    });
    langSelect.addEventListener('change', (e) => {
        if (e.target.getAttribute('data-id') === 'lang-select') {
            ui.setLang(e.target.value)
        }
    })

    const keyboard = new Keyboard(document.querySelector('[data-id=keyboard]'), langs, langs[0], langs[1], layouts, assignments);
    ui.addClass(keyboard);
});