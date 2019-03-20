core.registerOperator("descbox", function (operator) {
    let me = this;
    me.operator = operator;
    me.settings = {
        property: "description",
        operationMode: "focus",
        staticItem: ""
    };

    me.rootdiv = document.createElement("div");
    //Add div HTML here
    me.rootdiv.innerHTML = `<textarea></textarea>`;
    me.textarea = me.rootdiv.querySelector("textarea");
    me.textarea.style.width = "100%";
    me.textarea.style.height = "100%";
    me.textarea.style.resize = "none";
    me.currentID = "";

    operator.div.appendChild(me.rootdiv);

    //Handle item updates
    me.updateItem = function (id) {
        if (id == me.settings.currentID && id) {
            if (core.items[id] && core.items[id][me.settings.property]) me.textarea.value = core.items[id][me.settings.property];
            else me.textarea.value = "";
            me.textarea.disabled = false;
        } else {
            if (!me.settings.currentID) {
                me.textarea.disabled = true;
                me.textarea.value = "Select an item to view its description.";
            }
        }
    }

    core.on("updateItem", function (d) {
        let id = d.id;
        let sender = d.sender;

        if (sender == me) return;
        //Check if item is shown
        //Update item if relevant
        me.updateItem(id);
    });

    //First time load

    me.updateItem(me.settings.currentID);

    me.updateSettings = function () {
        if (me.settings.operationMode == 'static') {
            me.settings.currentID = me.settings.staticItem;
            if (!core.items[staticItem]) {
                let it = new _item();
                it[me.settings.property] = "";
                core.items[staticItem] = it;
                core.fire("create", {
                    sender: this,
                    id: staticItem
                });
                core.fire("updateItem", {
                    sender: this,
                    id: staticItem
                });
            }
        }
        me.updateItem(me.settings.currentID);
    }

    //Saving and loading
    me.toSaveData = function () {
        return me.settings;
    }

    me.fromSaveData = function (d) {
        Object.assign(me.settings, d);
        //then rehash the display or sth
        me.updateItem(me.settings.currentID);
    }

    //Register changes with core
    me.somethingwaschanged = function () {
        core.items[me.settings.currentID][me.settings.property] = me.textarea.value;
        core.fire("updateItem", {
            id: me.settings.currentID,
            sender: me
        });
    }

    me.textarea.addEventListener("input", me.somethingwaschanged);

    //Create a settings dialog
    scriptassert([
        ["dialog", "genui/dialog.js"]
    ], () => {
        me.dialog = document.createElement("div");

        me.dialog.innerHTML = `
        <div class="dialog">
        </div>`;
        dialogManager.checkDialogs(me.dialog);
        //Restyle dialog to be a bit smaller
        me.dialog = me.dialog.querySelector(".dialog");
        me.innerDialog = me.dialog.querySelector(".innerDialog");
        operator.div.appendChild(me.dialog);
        let d = document.createElement("div");
        d.innerHTML = `
            <h1>Role</h1>
            <select data-role="operationMode">
            <option value="static">Display static item</option>
            <option value="focus">Display focused item</option>
            </select>
            <br/>
            <input data-role="staticItem" placeholder="Static item to display...">
            <br>
            <p> Or, click to target 'focus' events from an operator...
            <input data-role="focusOperatorID" placeholder="Operator UID (use the button)">
            <button class="targeter">Select operator</button>
            </br>
            <input data-role="property" placeholder="Enter the property to display...">
        `;
        let targeter = d.querySelector("button.targeter");
        targeter.addEventListener("click", function () {
            core.target().then((id) => {
                d.querySelector("[data-role='focusOperatorID']").value = id;
                me.settings['focusOperatorID'] = id
            })
        })
        let roledItems = d.querySelector("[data-role]");
        for (let q = 0; q < roledItems.length; q++) {
            roledItems[q].value = me.settings[roledItems[q].dataset.role];
        }

        me.innerDialog.appendChild(d);
        me.innerDialog.addEventListener("input", function (e) {
            if (e.target.dataset.role) {
                me.settings[e.target.dataset.role] = e.target.value;
            }
        })

        //When the dialog is closed, update the settings.
        me.dialog.querySelector(".cb").addEventListener("click", function () {
            let its=me.dialog.querySelector("[data-role]");
            for (let i=0;i<its.length;i++){
                me.settings[its.dataset.role]=its.value;
            }
            me.updateSettings();
            
        })

        me.showSettings = function () {
            //fill out some details
            for (i in me.settings) {
                let it=me.dialog.querySelector("[data-role='" + i + "']");
                if (it)it.value = me.settings[i];
            }
            me.dialog.style.display = "block";
        }
    })

    //Core will call me when an object is focused on from somewhere
    core.on("focus", function (d) {
        let id = d.id;
        let sender = d.sender;
        if (me.settings['focusOperatorID']) {
            if (me.settings['focusOperatorID'] == sender.container.uuid) {
                me.settings.currentID = id;
                me.updateItem(id);
            }
        } else {
            //calculate the base rect of the sender
            let baserectSender = sender.operator.rect;
            while (baserectSender.parentRect) baserectSender = baserectSender.parentRect;
            //calculate my base rect
            let myBaseRect = me.operator.rect;
            while (myBaseRect.parentRect) myBaseRect = myBaseRect.parentRect;
            //if they're the same, then update.
            if (myBaseRect == baserectSender) {
                if (me.settings.operationMode == 'focus') {
                    me.settings.currentID = id;
                    me.updateItem(id);
                }
            }
        }
        core.fire("viewUpdate");
    });
    core.on("deleteItem", function (d) {
        let id = d.id;
        let s = d.sender;
        if (me.settings.currentID == id) {
            me.settings.currentID = undefined;
        };
        me.updateItem(undefined);
    });
});