core.registerOperator("scriptrunner", {
    displayName: "Scriptrunner",
    description: "Runs scripts."
}, function (container) {
    let me = this;
    me.container = container;//not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {};

    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
        <h1>WARNING: THIS SCRIPT IS POTENTIALLY INSECURE. ONLY RUN TRUSTED SCRIPTS.</h1>
        <p>Press 'Update' to execute this script.</p>
        <textarea style="width: 100%; height: 50%"; placeholder="Enter script here:"></textarea>
        <br>
        <button>Update</button>
        <div id="output" style="overflow-y: auto; height: 30%;"></div>
    `;

    /*Example script:*/
    /*
    instance.on("updateItem",(d)=>{
        console.log(core.items[d.id]);
    })
    */

    container.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////

    //this is called when an item is updated (e.g. by another operator)
    core.on("updateItem", (d) => {
        if (d.sender!="GARBAGE_COLLECTOR"){
            if (this.currentInstance)this.currentInstance.fire("updateItem", d);
        }
        return false;
    });
    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    function instance() {
        this.log = function (data) {
            let p = document.createElement("p");
            p.innerHTML = JSON.stringify(data);
            me.rootdiv.querySelector("#output").appendChild(p);
        }
        this.logEx=(data)=>{
            this.log(String(data))
        }
        addEventAPI(this,this.logEx);
    }

    this.execute = () => {
        this.currentInstance = new instance();
        let wrapped = `(function factory(instance){
            ${this.settings.script}
        })`;
        eval(wrapped)(this.currentInstance);
    }

    this.fromSaveData = (d) => {
        //this is called when your operator is started OR your operator loads for the first time
        Object.assign(this.settings, d);
        this.rootdiv.querySelector("textarea").value = this.settings.script || "";
        //don't execute, just flag this as needing attention
        textarea.style.background="green";
    }
    this.rootdiv.querySelector("button").addEventListener("click", () => {
        textarea.style.background="white";
        this.settings.script = this.rootdiv.querySelector("textarea").value;
        this.execute();
    })


    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `WARNING: DO NOT ACCEPT OTHERS' SCRIPTS IN GENERAL!`;
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

    //Allow tab to work
    let textarea = this.rootdiv.querySelector('textarea');
    textarea.addEventListener("keydown", (e) => {
        textarea.style.background="lightgreen";
        if (e.keyCode == 9 || e.which == 9) {
            e.preventDefault();
            var s = e.target.selectionStart;
            e.target.value = e.target.value.substring(0, e.target.selectionStart) + "\t" + e.target.value.substring(e.target.selectionEnd);
            e.target.selectionEnd = s + 1;
        }
    });

});