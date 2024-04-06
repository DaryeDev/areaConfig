let z = 1

function fixZ(persistentBoxes) {
    let minZ = Infinity;
    for (let boxId in persistentBoxes) {
        if (persistentBoxes[boxId].z < minZ) {
            minZ = persistentBoxes[boxId].z;
        }
    }
    if (minZ === Infinity) minZ = 1;

    for (let boxId in persistentBoxes) {
        persistentBoxes[boxId].z = (persistentBoxes[boxId].z % minZ)+1;
        if (z < persistentBoxes[boxId].z) z = persistentBoxes[boxId].z+1;
    }

    return persistentBoxes; 
}

class Box {
    constructor(container, data = {}, canResize = true, canRotate = true) {
        this.container = container;

        // var persistantData = fixZ(JSON.parse(localStorage.getItem("persistentBoxes") || "{}"))[data.id] || {};
        var persistantData = {};
        this.x = persistantData.x || (data.x/1920) || 0;
        this.y = persistantData.y || (data.y/1080) || 0;
        this.z = persistantData.z || data.z || 0;
        this.w = persistantData.w || (data.w/1920) || 0.1;
        this.h = persistantData.h || (data.h/1080) || 0.1;
        this.minW = (data.minW/1920) || 40;
        this.minH = (data.minH/1080) || 40;
        this.rotate = persistantData.rotate || data.rotate || 0;
        this.aspectRatio = data.aspectRatio ? data.aspectRatio.split('/').map(Number) : null;

        this.canResize = canResize;
        this.canRotate = canRotate;

        this.id = data.id || false;

        this.box = document.createElement("div");

        var innerContainer = document.createElement("div");
        innerContainer.className = "container";
        innerContainer.innerHTML = data.innerHTML || "";
        this.box.appendChild(innerContainer);

        this.controls = document.createElement("div");
        this.controls.className = "controls hidden";
        if (this.canResize) {
            this.controls.innerHTML += '<div class="dot left-top"></div><div class="dot left-bottom"></div><div class="dot right-bottom"></div><div class="dot right-top"></div>'
            if (!this.aspectRatio) {
                this.controls.innerHTML += '<div class="dot bottom-mid"></div><div class="dot left-mid"></div><div class="dot right-mid"></div><div class="dot top-mid"></div>'
            }
        }
        if (this.canRotate) {
            this.controls.innerHTML += '<div class="dot rotate"></div><div class="rotate-link"></div>'
        }
        this.box.appendChild(this.controls);
        this.box.hidden = data.canBeEdited || false;

        this.box.setAttribute("class", "box");

        this.boxWrapper = document.createElement("div");
        this.boxWrapper.setAttribute("class", "box-wrapper");
        this.boxWrapper.style.zIndex = this.z
        this.boxWrapper.appendChild(this.box);


        // drag support
        var thiss = this;
        this.boxWrapper.addEventListener('mousedown', function (event) {
            if (thiss.box.classList.contains("movable")) {
                thiss.z = thiss.z + 1
                thiss.boxWrapper.style.zIndex = thiss.z
                

                if (event.target.className == "box-wrapper" || event.target.className.indexOf("dot") > -1) {
                    return;
                }

                var initX = this.offsetLeft;
                var initY = this.offsetTop;
                var mousePressX = event.clientX;
                var mousePressY = event.clientY;


                function eventMoveHandler(event) {
                    thiss.repositionElement((initX + (event.clientX - mousePressX))/thiss.container.clientWidth,
                        (initY + (event.clientY - mousePressY))/thiss.container.clientHeight);
                }

                thiss.container.addEventListener('mousemove', eventMoveHandler);
                thiss.container.addEventListener('mouseup', function eventEndHandler() {
                    // thiss.trySave();
                    thiss.container.removeEventListener('mousemove', eventMoveHandler);
                    thiss.container.removeEventListener('mouseup', eventEndHandler);
                });
            }
        });
        // done drag support

        // handle resize
        this.elements = {};

        if (this.canResize) {
            this.elements.leftTop = this.box.querySelector(".left-top");
            this.elements.rightTop = this.box.querySelector(".right-top");
            this.elements.rightBottom = this.box.querySelector(".right-bottom");
            this.elements.leftBottom = this.box.querySelector(".left-bottom");

            this.elements.leftTop.addEventListener('mousedown', e => this.resizeHandler(e, true, true, true, true));
            this.elements.rightTop.addEventListener('mousedown', e => this.resizeHandler(e, false, true, true, true));
            this.elements.rightBottom.addEventListener('mousedown', e => this.resizeHandler(e, false, false, true, true));
            this.elements.leftBottom.addEventListener('mousedown', e => this.resizeHandler(e, true, false, true, true));

            if (!this.aspectRatio) {
                this.elements.bottomMid = this.box.querySelector(".bottom-mid");
                this.elements.topMid = this.box.querySelector(".top-mid");
                this.elements.leftMid = this.box.querySelector(".left-mid");
                this.elements.rightMid = this.box.querySelector(".right-mid");

                this.elements.rightMid.addEventListener('mousedown', e => this.resizeHandler(e, false, false, true, false));
                this.elements.leftMid.addEventListener('mousedown', e => this.resizeHandler(e, true, false, true, false));
                this.elements.topMid.addEventListener('mousedown', e => this.resizeHandler(e, false, true, false, true));
                this.elements.bottomMid.addEventListener('mousedown', e => this.resizeHandler(e, false, false, false, true));
            }
        }

        // handle rotation
        if (this.canRotate) {
            var rotate = this.box.querySelector(".rotate");
            rotate.addEventListener('mousedown', function (event) {
                // if (event.target.className.indexOf("dot") > -1) {
                //     return;
                // }

                var initX = this.offsetLeft;
                var initY = this.offsetTop;
                var mousePressX = event.clientX;
                var mousePressY = event.clientY;


                var arrow = thiss.box
                var arrowRects = arrow.getBoundingClientRect();
                var arrowX = arrowRects.left + arrowRects.width / 2;
                var arrowY = arrowRects.top + arrowRects.height / 2;

                function eventMoveHandler(event) {
                    var angle = Math.atan2(event.clientY - arrowY, event.clientX - arrowX) + Math.PI / 2;
                    thiss.rotateBox(angle * 180 / Math.PI);
                }

                thiss.container.addEventListener('mousemove', eventMoveHandler);

                thiss.container.addEventListener('mouseup', function eventEndHandler() {
                    // thiss.trySave();
                    thiss.container.removeEventListener('mousemove', eventMoveHandler);
                    thiss.container.removeEventListener('mouseup', eventEndHandler);
                });
            });
        }

    }

    toggleControls = function (enabled=undefined) {
        if (enabled === undefined) {
            this.controls.classList.toggle("hidden");
            this.box.classList.toggle("movable");
        } else {
            if (enabled) { 
                this.controls.classList.remove("hidden");
                this.box.classList.add("movable");
            } else { 
                this.controls.classList.add("hidden"); 
                this.box.classList.add("movable");
            }
        }
    }

    inject = function (parent=this.container) {
        parent.appendChild(this.boxWrapper);
        this.resize(this.w, this.h);
        this.repositionElement(this.x, this.y);
        this.rotateBox(this.rotate * 180 / Math.PI);
    }

    // trySave = function () {
    //     if (this.persistant) {
    //         var persistantData = JSON.parse(localStorage.getItem("persistentBoxes") || "{}")
    //         var thisPersistant = this.persistant
    //         persistantData[thisPersistant] = {...persistantData[thisPersistant], x: this.x, y: this.y, w: this.w, h: this.h, z: this.z, rotate: this.rotate};
    //         localStorage.setItem("persistentBoxes", JSON.stringify(persistantData));
    //     }
    // }

    repositionElement = function (x, y) {
        this.boxWrapper.style.left = x*this.container.clientWidth + 'px';
        this.boxWrapper.style.top = y*this.container.clientHeight + 'px';

        this.x = parseFloat(x)
        this.y = parseFloat(y)
    }

    resize = function (w, h) { // input del porcentaje que ocupan en pantalla
        this.box.style.width = w*this.container.clientWidth + 'px';
        this.box.style.height = h*this.container.clientHeight + 'px';

        this.w = parseFloat(w)
        this.h = parseFloat(h)
    }


    getCurrentRotation = function (el) {
        var st = window.getComputedStyle(el, null);
        var tm = st.getPropertyValue("-webkit-transform") ||
            st.getPropertyValue("-moz-transform") ||
            st.getPropertyValue("-ms-transform") ||
            st.getPropertyValue("-o-transform") ||
            st.getPropertyValue("transform")
        "none";
        if (tm != "none") {
            var values = tm.split('(')[1].split(')')[0].split(',');
            var angle = Math.round(Math.atan2(values[1], values[0]) * (180 / Math.PI));
            return (angle < 0 ? angle + 360 : angle);
        }
        return 0;
    }

    rotateBox = function (deg) {
        this.boxWrapper.style.transform = `rotate(${deg}deg)`;
        this.rotate = deg * Math.PI / 180;
    }

    importSaveData = function (data) {
        this.resize(data.w||this.w, data.h||this.h);
        this.repositionElement(data.x||this.x, data.y||this.y);
        this.rotateBox((data.rotate||this.rotate) * 180 / Math.PI);

        this.aspectRatio = data.aspectRatio||this.aspectRatio
        this.box.querySelector(".container").innerHTML = data.innerHTML || this.box.querySelector(".container").innerHTML

        this.controls.hidden = data.hasOwnProperty('canBeEdited') ? data.canBeEdited : this.controls.hidden;
    }

    exportSaveData = function () {
        return {
            w: this.w,
            h: this.h,
            x: this.x,
            y: this.y,
            rotate: this.rotate,
        }
    }

    resizeHandler = function (event, left = false, top = false, xResize = false, yResize = false) {
        var thiss = this;
        var initX = this.boxWrapper.offsetLeft;
        var initY = this.boxWrapper.offsetTop;
        var mousePressX = event.clientX;
        var mousePressY = event.clientY;

        var initW = this.box.offsetWidth;
        var initH = this.box.offsetHeight;

        var initRotate = this.getCurrentRotation(this.boxWrapper);
        var initRadians = initRotate * Math.PI / 180;
        var cosFraction = Math.cos(initRadians);
        var sinFraction = Math.sin(initRadians);
        function eventMoveHandler(event) {
            var wDiff = (event.clientX - mousePressX);
            var hDiff = (event.clientY - mousePressY);
            var rotatedWDiff = cosFraction * wDiff + sinFraction * hDiff;
            var rotatedHDiff = cosFraction * hDiff - sinFraction * wDiff;

            var newW = initW, newH = initH, newX = initX, newY = initY;

            // calculate new width and height
            if (xResize) {
                if (left) {
                    newW = initW - rotatedWDiff;
                } else {
                    newW = initW + rotatedWDiff;
                }
                if (newW < thiss.minW) {
                    newW = thiss.minW;
                }
            }

            if (yResize) {
                if (top) {
                    newH = initH - rotatedHDiff;
                } else {
                    newH = initH + rotatedHDiff;
                }
                if (newH < thiss.minH) {
                    newH = thiss.minH;
                }
            }

            var scale;
            // constrain aspect ratio, if a corner is being dragged
            // can remove the conditional if aspect ratio should always be preserved
            if (thiss.aspectRatio && xResize && yResize) {
                scale = Math.max(newW / initW, newH / initH);
                newW = scale * initW;
                newH = scale * initH;
            }

            // recalculate position
            if (xResize) {
                if (left) {
                    rotatedWDiff = initW - newW;
                } else {
                    rotatedWDiff = newW - initW;
                }
                newX += 0.5 * rotatedWDiff * cosFraction;
                newY += 0.5 * rotatedWDiff * sinFraction;
            }


            if (yResize) {
                if (top) {
                    rotatedHDiff = initH - newH;
                } else {
                    rotatedHDiff = newH - initH;
                }
                newX -= 0.5 * rotatedHDiff * sinFraction;
                newY += 0.5 * rotatedHDiff * cosFraction;
            }
            
            thiss.resize(newW/thiss.container.clientWidth, newH/thiss.container.clientHeight);
            thiss.repositionElement(newX/thiss.container.clientWidth, newY/thiss.container.clientHeight);
        }


        thiss.container.addEventListener('mousemove', eventMoveHandler);
        thiss.container.addEventListener('mouseup', function eventEndHandler() {
            // thiss.trySave();
            thiss.container.removeEventListener('mousemove', eventMoveHandler);
            thiss.container.removeEventListener('mouseup', eventEndHandler);
        });
    }
}


// class BoxElement extends HTMLElement {
//     constructor() {
//         super();
//     }

//     connectedCallback() {
//         const shadow = this.attachShadow({ mode: "open" });

//         const wrapper = new Box({x: this.getAttribute("x"), y: this.getAttribute("y"), w: this.getAttribute("w"), h: this.getAttribute("h"), aspectRatio: this.getAttribute("aspectRatio"), minW: this.getAttribute("minW"), minH: this.getAttribute("minH"), maxW: this.getAttribute("maxW"), maxH: this.getAttribute("maxH"), rotate: this.getAttribute("rotate"), innerHTML: this.innerHTML, persistant: this.getAttribute("persistant")}, this.hasAttribute("canResize"), this.hasAttribute("canRotate"));

//         const style = document.createElement("style");
//         style.textContent = `
//         .box {
//             background-color: #00BCD4;
//             position: relative;
//             user-select: none;
//             transform: translate(-50%, -50%);
//         }

//         .box .controls.hidden{
//             display: none;
//         }
//         .box.movable:hover {
//             cursor: move;
//         }
        
//         .box-wrapper {
//             position: absolute;
//             transform-origin: top left;
//             user-select: none;
//         }
        
//         .dot {
//             height: 10px;
//             width: 10px;
//             background-color: #1E88E5;
//             position: absolute;
//             border-radius: 100px;
//             border: 1px solid white;
//             user-select: none;
//         }
        
//         .dot:hover {
//             background-color: #0D47A1;
//         }
        
//         .dot.left-top {
//             top: -5px;
//             left: -5px;
//             cursor: nw-resize;
//         }
        
//         .dot.left-bottom {
//             bottom: -5px;
//             left: -5px;
//             cursor: sw-resize;
//         }
        
//         .dot.right-top {
//             top: -5px;
//             right: -5px;
//             cursor: ne-resize;
//         }
        
//         .dot.right-bottom {
//             bottom: -5px;
//             right: -5px;
//             cursor: se-resize;
//         }
        
//         .dot.top-mid {
//             top: -5px;
//             left: calc(50% - 5px);
//             cursor: n-resize;
//         }
        
//         .dot.left-mid {
//             left: -5px;
//             top: calc(50% - 5px);
//             cursor: w-resize;
//         }
        
//         .dot.right-mid {
//             right: -5px;
//             top: calc(50% - 5px);
//             cursor: e-resize;
//         }
        
//         .dot.bottom-mid {
//             bottom: -5px;
//             left: calc(50% - 5px);
//             cursor: s-resize;
//         }
        
//         .dot.rotate {
//             top: -30px;
//             left: calc(50% - 5px);
//             cursor: url('https://findicons.com/files/icons/1620/crystal_project/16/rotate_ccw.png'), auto;
//         }
        
//         .rotate-link {
//             position: absolute;
//             width: 1px;
//             height: 15px;
//             background-color: #1E88E5;
//             top: -20px;
//             left: calc(50% + 0.5px);
//             z-index: -1;
//         }
//         `;
//         shadow.appendChild(style);
        
//         wrapper.inject(shadow);
//     }
// }
// customElements.define("box-area", BoxElement);

class AreaConfig {
    constructor(element=document.body, config=[], width="auto", height="auto", savedData=[], editMode=false, style="") { // config = [{id: "alert", default: {x: 0, y: 0, w: 100, h: 100, aspectRatio: "16/9", innerHtml: "<div style="background-color: #00BCD4; width: 100%; height: 100%;"></div>"}, canBeEdited: true(valorPorDefecto)}]
        this.iFrame = document.createElement("iframe");
        this.iFrame.className = "areaConfig";
        this.iFrame.frameBorder = "0";
        this.iFrame.style.width = width;
        this.iFrame.style.height = height;
        element.appendChild(this.iFrame);
        this.iFrameBody = (this.iFrame.contentDocument || this.iFrame.contentWindow.document).body

        const styleElement = document.createElement("style");
        styleElement.textContent = `

        html {
            width: 100%;
            height: max-content;
        }
        
        body {
            overflow: clip;
            margin: 0;

            --16-9mask: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAJAQMAAAAB5D5xAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAAJwAAACcBKgmRTwAAAANQTFRFAAAAp3o92gAAAA1JREFUeJxjZGBgxIEAAKIACoHwR1cAAAAASUVORK5CYII=');
        
            -webkit-mask-image: var(--16-9mask);
            mask-image: var(--16-9mask);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            mask-size: cover;
            
            aspect-ratio: 16/9;
            max-width: 100%;
            max-height: 100%;
        }

        .areaConfig {
            width: 100%;
            height: 100%;

            ${style}
        }

        .box {
            background-color: #00BCD4;
            position: relative;
            user-select: none;
            transform: translate(-50%, -50%);
        }

        .box .controls.hidden{
            display: none;
        }
        .box.movable:hover {
            cursor: move;
        }
        
        .box-wrapper {
            position: absolute;
            transform-origin: top left;
            user-select: none;
        }
        
        .dot {
            height: 10px;
            width: 10px;
            background-color: #1E88E5;
            position: absolute;
            border-radius: 100px;
            border: 1px solid white;
            user-select: none;
        }
        
        .dot:hover {
            background-color: #0D47A1;
        }
        
        .dot.left-top {
            top: -5px;
            left: -5px;
            cursor: nw-resize;
        }
        
        .dot.left-bottom {
            bottom: -5px;
            left: -5px;
            cursor: sw-resize;
        }
        
        .dot.right-top {
            top: -5px;
            right: -5px;
            cursor: ne-resize;
        }
        
        .dot.right-bottom {
            bottom: -5px;
            right: -5px;
            cursor: se-resize;
        }
        
        .dot.top-mid {
            top: -5px;
            left: calc(50% - 5px);
            cursor: n-resize;
        }
        
        .dot.left-mid {
            left: -5px;
            top: calc(50% - 5px);
            cursor: w-resize;
        }
        
        .dot.right-mid {
            right: -5px;
            top: calc(50% - 5px);
            cursor: e-resize;
        }
        
        .dot.bottom-mid {
            bottom: -5px;
            left: calc(50% - 5px);
            cursor: s-resize;
        }
        
        .dot.rotate {
            top: -30px;
            left: calc(50% - 5px);
            cursor: url('https://findicons.com/files/icons/1620/crystal_project/16/rotate_ccw.png'), auto;
        }
        
        .rotate-link {
            position: absolute;
            width: 1px;
            height: 15px;
            background-color: #1E88E5;
            top: -20px;
            left: calc(50% + 0.5px);
            z-index: -1;
        }
        `;
        this.iFrameBody.appendChild(styleElement);


        this.areaConfigElement = document.createElement("div");
        this.areaConfigElement.className = "areaConfig";
        this.iFrameBody.appendChild(this.areaConfigElement);

        this.boxes = [];
        for (let i = 0; i < config.length; i++) {
            var boxConfig = config[i].default;

            let savedBox = savedData.find(saved => saved.id === config[i].id);
            if (savedBox) {
                boxConfig = Object.assign({}, config[i].default, savedBox);
            }
            var newBox = new Box(this.areaConfigElement, {...boxConfig, id: config[i].id}, config[i].canBeEdited, config[i].canBeEdited)
        
            this.boxes.push(newBox);
            newBox.inject(this.areaConfigElement)
        }
        if (editMode) {
            this.toggleEditMode(true);
        }
    }

    toggleEditMode(enabled=undefined) {
        this.boxes.forEach(box => {
            box.toggleControls(enabled);
        });
    }

    importSaveData(data) {
        for (let i = 0; i < data.length; i++) {
            let box = this.boxes.find(saved => saved.id === data[i].id);
            if (box) {
                box.importSaveData(data[i].savedData);
            }
        }
    }

    exportSaveData() {
        let data = [];
        this.boxes.forEach(box => {
            data.push({id: box.id, savedData: box.exportSaveData()});
        });
        return data;
    }
}