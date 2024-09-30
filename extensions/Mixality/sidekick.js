// Name: SIDEKICK
// ID: gpioExtension
// Description: SIDEKICK blocks.
// By: Mixality <https://github.com/Mixality/>
// License: MIT

(function (Scratch) {
    "use strict";

    /** @type {HTMLIFrameElement|null} */
    let iframe = null;
    let overlay = null;

    let isCheckingUV = false;
    let performedUVSensorCheck = false;
    let distanceToUVSensor = 0;

    let uvStartTime = 0;
    let uvEndTime = 0;

    let notChecking = true;
    let checkedStart = true;
    let checkedEnd = true;
    let timeCheckedStart = 0.00;
    let timeCheckedEnd = 0.00;

    let timeoutID = 0;

    const Cast = Scratch.Cast;
    const BlockType = Scratch.BlockType;
    const ArgumentType = Scratch.ArgumentType;

    const vm = Scratch.vm;
    const runtime = vm.runtime;
    const renderer = vm.renderer;

    let currentStep = 1;

    let triggerPin = 25; // Beispiel-Pin für Trigger
    let echoPin = 18;
    let echoStart = 0;
    let echoEnd = 0;
    let tick = 0;

    const TEMPERATURE = 20;
    const SPEED_OF_SOUND = 33100 + (0.6 * TEMPERATURE);

    let sensorState = false;

    let startTimeChanged = [false, false, false, false, false, false, false, false, false];
    let endTimeChanged = [false, false, false, false, false, false, false, false, false];
    let waitingBetweenTrigger = [false, false, false, false, false, false, false, false, false];
    let waitingAfterTrigger = [false, false, false, false, false, false, false, false, false];
    let finishedWaitingBetweenTrigger = [false, false, false, false, false, false, false, false, false];
    let pulseStart = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let pulseEnd = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let pulseDuration = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let distance = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let gpioNumbersEchoPin = [18, 23, 24, 5, 11, 9, 6, 13, 19];

    let waitForEchoPinStartFlag = [false, false, false, false, false, false, false, false, false];
    let waitForEchoPinTimeElapsed = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let waitForEchoPinTimeStart = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let waitForEchoPinTimeEnd = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    function pauseBrowser(millis) {
        var date = Date.now();
        var curDate = null;
        do {
            curDate = Date.now();
        } while (curDate - date < millis)
    }

    function whilePinStateEquals0() {
        const GPIO_US_ECHO = 18;
        var pinState;
        do {
            pinState = EditorPreload.gpioGet(GPIO_US_ECHO, 0, 1);
            uvStartTime = performance.now();
        } while (pinState == 0)
    }

    function whilePinStateEquals1() {
        const GPIO_US_ECHO = 18;
        var pinState;
        do {
            pinState = EditorPreload.gpioGet(GPIO_US_ECHO, 0, 1);
            uvEndTime = performance.now();
        } while (pinState == 1)
    }

    async function startCheck() {
        isDistanceSmallerThan();
    }

    async function isDistanceSmallerThan() {

        pauseBrowser(1000);

        // Set trigger pin to output and set to low
        EditorPreload.gpioSet(25, 0);
        // Set echo pin to input and set to pulled down
        EditorPreload.gpioPull(18, 1);

        isCheckingUV = true;
        const GPIO_US_ECHO = 18;
        const TEMPERATURE = 20;
        const SPEED_OF_SOUND = 33100 + (0.6 * TEMPERATURE);
        const GPIO_US_TRIGGER = 25;

        let startTime = 0;
        let endTime = 0;
        let elapsed = 0;
        let distance = 0;
        let StartFlag = false;

        let start = performance.now();
        elapsed = 0;
        EditorPreload.gpioSet(GPIO_US_TRIGGER, 1);
        pauseBrowser(0.01);
        EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);

        whilePinStateEquals0();
        whilePinStateEquals1();

        elapsed = uvEndTime - uvStartTime;
        distance = elapsed * 34.3 / 2;

        console.log("ready checking");

        console.log("isCheckingUV: " + isCheckingUV);

        distanceToUVSensor = distance;
        performedUVSensorCheck = true;
        isCheckingUV = false;

        console.log("isCheckingUV: " + isCheckingUV);
    }

    /**
     * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
     * @type {string}
     */
    // eslint-disable-next-line max-len
    const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgd2lkdGg9IjEwMjRweCIgaGVpZ2h0PSIxMDI0cHgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogICAgPGcgaWQ9ImctMSIgdHJhbnNmb3JtPSJtYXRyaXgoMS4xNjMxMzQsIDAsIDAsIDEuMTYzMDgxLCAtOS4wMjYwNDQsIC0zNS4zNTM0ODkpIiBzdHlsZT0iIj4NCiAgICAgICAgPHRpdGxlPmxvZ280PC90aXRsZT4NCiAgICAgICAgPGcgc3R5bGU9IiIgdHJhbnNmb3JtPSJtYXRyaXgoMC44MzI1MTcsIDAsIDAsIDAuODMyNTE3LCA3NS4wMjQxNzgsIDgyLjg0NjI2OCkiPg0KICAgICAgICAgICAgPHRpdGxlPmhpbnRlcmdydW5kPC90aXRsZT4NCiAgICAgICAgICAgIDxwYXRoDQogICAgICAgICAgICAgICAgZD0iTSAwIDM0OC4xNzkgTCAzMzcuNjMgNzYxLjEzIEwgMzgyLjk5NCA3NjEuMTMgTCA0MDMuMDgxIDc4Ni41OTIgTCA0NjAuMzgyIDc4Ni41OTIgTCA0ODQuMDkgNzYxLjEzIEwgNTM1LjAyMyA3NjEuMTMgTCA4OTYgMzQ4LjE3OSBMIDg5NS41NjcgMzIwLjI0NiBMIC0wLjEgMzE5LjkzNSBMIDAgMzQ4LjE3OSBaIg0KICAgICAgICAgICAgICAgIGlkPSJwYXRoLTEiDQogICAgICAgICAgICAgICAgc3R5bGU9InN0cm9rZS1saW5lY2FwOiByb3VuZDsgc3Ryb2tlLWxpbmVqb2luOiByb3VuZDsgc3Ryb2tlLXdpZHRoOiAzMHB4OyBzdHJva2U6IHJnYigxNDYsIDE3MCwgMTIxKTsgZmlsbDogcmdiKDE4MiwgMjEzLCAxNTEpOyI+DQogICAgICAgICAgICAgICAgPHRpdGxlPmZ1ZWxsdW5nPC90aXRsZT4NCiAgICAgICAgICAgIDwvcGF0aD4NCiAgICAgICAgICAgIDxwYXRoDQogICAgICAgICAgICAgICAgZD0iTSAxLjE0OCAzMTkuNTE3IEwgMzM3LjkxMyA3MzEuNDA5IEwgMzgzLjE2MSA3MzEuNDA5IEwgNDAzLjE5NiA3NTYuODA2IEwgNDYwLjM1IDc1Ni44MDYgTCA0ODMuOTk3IDczMS40MDkgTCA1MzQuOCA3MzEuNDA5IEwgODk0Ljg1MiAzMTkuNTE3IEwgNzI5LjQzNSAxNDQuOTQ1IEwgMTY5Ljc2MyAxNDQuOTQ1IEwgMS4xNDggMzE5LjUxNyBaIg0KICAgICAgICAgICAgICAgIGlkPSJwYXRoLTIiDQogICAgICAgICAgICAgICAgc3R5bGU9InN0cm9rZS1saW5lY2FwOiByb3VuZDsgc3Ryb2tlLWxpbmVqb2luOiByb3VuZDsgc3Ryb2tlLXdpZHRoOiAzMHB4OyBmaWxsOiByZ2IoMTgyLCAyMTMsIDE1MSk7IHN0cm9rZTogcmdiKDE5NywgMjIxLCAxNzIpOyI+DQogICAgICAgICAgICAgICAgPHRpdGxlPmRpbWVuc2lvbjwvdGl0bGU+DQogICAgICAgICAgICA8L3BhdGg+DQogICAgICAgIDwvZz4NCiAgICAgICAgPGcgaWQ9ImctMiIgdHJhbnNmb3JtPSJtYXRyaXgoMC45MzE2NDksIDAsIDAsIDAuOTMxNjQ5LCAyNDYuNDIxODc1LCAxMzkuNzk1Njg1KSIgc3R5bGU9IiI+DQogICAgICAgICAgICA8dGl0bGU+d2FwcGVuPC90aXRsZT4NCiAgICAgICAgICAgIDxwYXRoDQogICAgICAgICAgICAgICAgZD0iTSAyMTMuMDY5MDAwMjQ0MTQwNjIgMjA1Ljg1MDAwNjEwMzUxNTYyIEwgMTY1Ljg1Njk5NDYyODkwNjI1IDMyMy42ODcwMTE3MTg3NSBMIDI0Mi42MjM5OTI5MTk5MjE4OCAyNzQuNjQwOTkxMjEwOTM3NSBMIDIyNS4zNzMwMDEwOTg2MzI4IDM2Ni4xNDA5OTEyMTA5Mzc1IEwgMTM3Ljc3OTAwNjk1ODAwNzggNDUyLjEwNDAwMzkwNjI1IEwgMTI5IDUwNC42NzU5OTQ4NzMwNDY5IEwgMTQyLjk2Mjk5NzQzNjUyMzQ0IDQ1Ni4xNjQwMDE0NjQ4NDM3NSBMIDI0MC41MDcwMDM3ODQxNzk3IDM4NS4yNjMwMDA0ODgyODEyNSBMIDI5Ny40NjQ5OTYzMzc4OTA2IDIwOC41ODIwMDA3MzI0MjE4OCBMIDIwOC4zNjA5OTI0MzE2NDA2MiAyNzMuMzgwMDA0ODgyODEyNSBMIDIzMS40NjIwMDU2MTUyMzQzOCAyMTYuOTg4MDA2NTkxNzk2ODggTCAzMTguMjk5OTg3NzkyOTY4NzUgMTMzLjk3NTk5NzkyNDgwNDcgWiINCiAgICAgICAgICAgICAgICBzdHlsZT0iZmlsbC1ydWxlOiBub256ZXJvOyBwYWludC1vcmRlcjogc3Ryb2tlOyBzdHJva2U6IHJnYigxOTcsIDIyMSwgMTcyKTsgc3Ryb2tlLXdpZHRoOiAxNTAuMzgxcHg7IHN0cm9rZS1saW5lam9pbjogcm91bmQ7IGZpbGw6IHJnYigxOTcsIDIyMSwgMTcyKTsiIC8+DQogICAgICAgICAgICA8cGF0aA0KICAgICAgICAgICAgICAgIGQ9Ik0gMjEzLjA2OTAwMDI0NDE0MDYyIDIwNS44NTAwMDYxMDM1MTU2MiBMIDE2NS44NTY5OTQ2Mjg5MDYyNSAzMjMuNjg3MDExNzE4NzUgTCAyNDIuNjIzOTkyOTE5OTIxODggMjc0LjY0MDk5MTIxMDkzNzUgTCAyMjUuMzczMDAxMDk4NjMyOCAzNjYuMTQwOTkxMjEwOTM3NSBMIDEzNy43NzkwMDY5NTgwMDc4IDQ1Mi4xMDQwMDM5MDYyNSBMIDEyOSA1MDQuNjc1OTk0ODczMDQ2OSBMIDE0Mi45NjI5OTc0MzY1MjM0NCA0NTYuMTY0MDAxNDY0ODQzNzUgTCAyNDAuNTA3MDAzNzg0MTc5NyAzODUuMjYzMDAwNDg4MjgxMjUgTCAyOTcuNDY0OTk2MzM3ODkwNiAyMDguNTgyMDAwNzMyNDIxODggTCAyMDguMzYwOTkyNDMxNjQwNjIgMjczLjM4MDAwNDg4MjgxMjUgTCAyMzEuNDYyMDA1NjE1MjM0MzggMjE2Ljk4ODAwNjU5MTc5Njg4IEwgMzE4LjI5OTk4Nzc5Mjk2ODc1IDEzMy45NzU5OTc5MjQ4MDQ3IFoiDQogICAgICAgICAgICAgICAgc3R5bGU9ImZpbGwtcnVsZTogbm9uemVybzsgcGFpbnQtb3JkZXI6IHN0cm9rZTsgc3Ryb2tlOiByZ2IoMjU1LCAyNTUsIDI1NSk7IHN0cm9rZS13aWR0aDogNzUuMTkwNnB4OyBzdHJva2UtbGluZWpvaW46IHJvdW5kOyBmaWxsOiByZ2IoMjU1LCAyNTUsIDI1NSk7IiAvPg0KICAgICAgICAgICAgPHBvbHlnb24NCiAgICAgICAgICAgICAgICBzdHlsZT0iZmlsbC1ydWxlOiBub256ZXJvOyBwYWludC1vcmRlcjogc3Ryb2tlOyBmaWxsOiByZ2IoMTgyLCAyMTMsIDE1MSk7IHN0cm9rZS13aWR0aDogNzUuMTkwNnB4OyBzdHJva2UtbGluZWpvaW46IHJvdW5kOyINCiAgICAgICAgICAgICAgICBwb2ludHM9IjIxMy4wNjkgMjA1Ljg1IDE2NS44NTcgMzIzLjY4NyAyNDIuNjI0IDI3NC42NDEgMjI1LjM3MyAzNjYuMTQxIDEzNy43NzkgNDUyLjEwNCAxMjkgNTA0LjY3NiAxNDIuOTYzIDQ1Ni4xNjQgMjQwLjUwNyAzODUuMjYzIDI5Ny40NjUgMjA4LjU4MiAyMDguMzYxIDI3My4zOCAyMzEuNDYyIDIxNi45ODggMzE4LjMgMTMzLjk3NiIgLz4NCiAgICAgICAgPC9nPg0KICAgIDwvZz4NCjwvc3ZnPg==';

    const pixelColor = new Array(70);
    pixelColor.fill(0);

    const featurePolicy = {
        accelerometer: "'none'",
        "ambient-light-sensor": "'none'",
        battery: "'none'",
        camera: "'none'",
        "display-capture": "'none'",
        "document-domain": "'none'",
        "encrypted-media": "'none'",
        fullscreen: "'none'",
        geolocation: "'none'",
        gyroscope: "'none'",
        magnetometer: "'none'",
        microphone: "'none'",
        midi: "'none'",
        payment: "'none'",
        "picture-in-picture": "'none'",
        "publickey-credentials-get": "'none'",
        "speaker-selection": "'none'",
        usb: "'none'",
        vibrate: "'none'",
        vr: "'none'",
        "screen-wake-lock": "'none'",
        "web-share": "'none'",
        "interest-cohort": "'none'",
    };

    const SANDBOX = [
        "allow-same-origin",
        "allow-scripts",
        "allow-forms",
        "allow-modals",
        "allow-popups",
        // The big one we don't want to include is allow-top-navigation
    ];

    let x = 0;
    let y = 0;
    let width = -1; // negative means default
    let height = -1; // negative means default
    let interactive = true;
    let resizeBehavior = "scale";

    const updateFrameAttributes = () => {
        if (!iframe) {
            return;
        }

        iframe.style.pointerEvents = interactive ? "auto" : "none";

        const { stageWidth, stageHeight } = Scratch.vm.runtime;
        const effectiveWidth = width >= 0 ? width : stageWidth;
        const effectiveHeight = height >= 0 ? height : stageHeight;

        if (resizeBehavior === "scale") {
            iframe.style.width = `${effectiveWidth}px`;
            iframe.style.height = `${effectiveHeight}px`;

            iframe.style.transform = `translate(${-effectiveWidth / 2 + x}px, ${-effectiveHeight / 2 - y
                }px)`;
            iframe.style.top = "0";
            iframe.style.left = "0";
        } else {
            // As the stage is resized in fullscreen mode, only % can be relied upon
            iframe.style.width = `${(effectiveWidth / stageWidth) * 100}%`;
            iframe.style.height = `${(effectiveHeight / stageHeight) * 100}%`;

            iframe.style.transform = "";
            iframe.style.top = `${(0.5 - effectiveHeight / 2 / stageHeight) * 100}%`;
            iframe.style.left = `${(0.5 - effectiveWidth / 2 / stageWidth) * 100}%`;
        }
    };

    const getOverlayMode = () =>
        resizeBehavior === "scale" ? "scale-centered" : "manual";

    const createFrame = (src) => {
        iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.style.position = "absolute";
        iframe.setAttribute("sandbox", SANDBOX.join(" "));
        iframe.setAttribute(
            "allow",
            Object.entries(featurePolicy)
                .map(([name, permission]) => `${name} ${permission}`)
                .join("; ")
        );
        iframe.setAttribute("allowtransparency", "true");
        iframe.setAttribute("allowtransparency", "true");
        iframe.setAttribute("src", src);

        overlay = Scratch.renderer.addOverlay(iframe, getOverlayMode());
        updateFrameAttributes();
    };

    const closeFrame = () => {
        if (iframe) {
            Scratch.renderer.removeOverlay(iframe);
            iframe = null;
            overlay = null;
        }
    };

    Scratch.vm.on("STAGE_SIZE_CHANGED", updateFrameAttributes);

    Scratch.vm.runtime.on("RUNTIME_DISPOSED", closeFrame);

    /**
     * An id for the space key on a keyboard.
     */
    const KEY_ID_SPACE = 'SPACE';
    const KEY_ID_1 = '1';
    const KEY_ID_2 = '2';
    const KEY_ID_3 = '3';
    const KEY_ID_4 = '4';
    const KEY_ID_5 = '5';
    const KEY_ID_6 = '6';
    const KEY_ID_7 = '7';
    const KEY_ID_8 = '8';
    const KEY_ID_9 = '9';

    /**
     * An id for the left arrow key on a keyboard.
     */
    const KEY_ID_LEFT = 'LEFT';

    /**
     * An id for the right arrow key on a keyboard.
     */
    const KEY_ID_RIGHT = 'RIGHT';

    /**
     * An id for the up arrow key on a keyboard.
     */
    const KEY_ID_UP = 'UP';

    /**
     * An id for the down arrow key on a keyboard.
     */
    const KEY_ID_DOWN = 'DOWN';


    /**
* Names used by keyboard io for keys used in scratch.
* @enum {string}
*/
    const SCRATCH_KEY_NAME = {
        [KEY_ID_SPACE]: 'space',
        [KEY_ID_LEFT]: 'left arrow',
        [KEY_ID_UP]: 'up arrow',
        [KEY_ID_RIGHT]: 'right arrow',
        [KEY_ID_DOWN]: 'down arrow',
        [KEY_ID_1]: '1',
        [KEY_ID_2]: '2',
        [KEY_ID_3]: '3',
        [KEY_ID_4]: '4',
        [KEY_ID_5]: '5',
        [KEY_ID_6]: '6',
        [KEY_ID_7]: '7',
        [KEY_ID_8]: '8',
        [KEY_ID_9]: '9'
    };

    const BitmapSkin = runtime.renderer.exports.BitmapSkin;
    class VideoSkin extends BitmapSkin {
        constructor(id, renderer, videoName, videoSrc) {
            super(id, renderer);

            /** @type {string} */
            this.videoName = videoName;

            /** @type {string} */
            this.videoSrc = videoSrc;

            this.videoError = false;

            this.readyPromise = new Promise((resolve) => {
                this.readyCallback = resolve;
            });

            this.videoElement = document.createElement("video");
            // Need to set non-zero dimensions, otherwise scratch-render thinks this is an empty image
            this.videoElement.width = runtime.stageWidth * 0.95;
            this.videoElement.height = runtime.stageHeight * 0.95;
            // controls autoplay loop
            this.videoElement.controls = true;
            this.videoElement.loop = true;

            this.videoElement.crossOrigin = "anonymous";
            this.videoElement.onloadeddata = () => {
                // First frame loaded
                this.readyCallback();
                this.markVideoDirty();
            };
            this.videoElement.onerror = () => {
                this.videoError = true;
                this.readyCallback();
                this.markVideoDirty();
            };
            this.videoElement.src = videoSrc;
            this.videoElement.currentTime = 0;

            this.videoDirty = true;

            this.reuploadVideo();
        }

        reuploadVideo() {
            this.videoDirty = false;
            if (this.videoError) {
                // Draw an image that looks similar to Scratch's normal costume loading errors
                const canvas = document.createElement("canvas");
                canvas.width = this.videoElement.videoWidth || 128;
                canvas.height = this.videoElement.videoHeight || 128;

                // canvas.width = Scratch.vm.runtime.stageWidth;
                // // || this.videoElement.videoWidth || 128;
                // canvas.height = Scratch.vm.runtime.stageHeight;
                // // || this.videoElement.videoHeight || 128;
                const ctx = canvas.getContext("2d");

                if (ctx) {
                    ctx.fillStyle = "#cccccc";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    const fontSize = Math.min(canvas.width, canvas.height);
                    ctx.fillStyle = "#000000";
                    ctx.font = `${fontSize}px serif`;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "center";
                    ctx.fillText("?", canvas.width / 2, canvas.height / 2);
                } else {
                    // guess we can't draw the error then
                }

                this.setBitmap(canvas);
            } else {
                this.setBitmap(this.videoElement);
            }
        }

        markVideoDirty() {
            this.videoDirty = true;
            this.emitWasAltered();
        }

        get size() {
            if (this.videoDirty) {
                this.reuploadVideo();
            }
            return super.size;
        }

        getTexture(scale) {
            if (this.videoDirty) {
                this.reuploadVideo();
            }
            return super.getTexture(scale);
        }

        dispose() {
            super.dispose();
            this.videoElement.pause();
        }
    }

    // /**
    //  * Class for the Raspberry Pi GPIO blocks in Scratch 3.0
    //  * @constructor
    //  */
    class GPIO {
        // constructor(runtime) {
        constructor() {
            /**
             * The runtime instantiating this block package.
             * @type {Runtime}
             */
            this.runtime = runtime;

            this.initGPIO();

            /** @type {Record<string, VideoSkin>} */
            this.videos = Object.create(null);

            runtime.on("PROJECT_STOP_ALL", () => this.resetEverything());
            runtime.on("PROJECT_START", () => this.resetEverything());

            runtime.on("BEFORE_EXECUTE", () => {
                for (const skin of renderer._allSkins) {
                    if (skin instanceof VideoSkin && !skin.videoElement.paused) {
                        skin.markVideoDirty();
                    }
                }
            });
        }

        // Initialisierung der GPIO-Pins für den Ultraschallsensor
        initGPIO() {
            // triggerpin zu out und low
            const GPIO_US_TRIGGER = 25;
            let setGpioDrive = 0;
            EditorPreload.gpioSet(GPIO_US_TRIGGER, setGpioDrive);

            // alle echopin zu in und low
            let setPullOp = 1; // 1 --> low
            const GPIO_US_ECHO_1 = 18;
            const GPIO_US_ECHO_2 = 23;
            const GPIO_US_ECHO_3 = 24;
            const GPIO_US_ECHO_4 = 5;
            const GPIO_US_ECHO_5 = 11;
            const GPIO_US_ECHO_6 = 9;
            const GPIO_US_ECHO_7 = 6;
            const GPIO_US_ECHO_8 = 13;
            const GPIO_US_ECHO_9 = 19;
            EditorPreload.gpioPull(GPIO_US_ECHO_1, setPullOp);
            EditorPreload.gpioPull(GPIO_US_ECHO_2, setPullOp);
            EditorPreload.gpioPull(GPIO_US_ECHO_3, setPullOp);
            EditorPreload.gpioPull(GPIO_US_ECHO_4, setPullOp);
            EditorPreload.gpioPull(GPIO_US_ECHO_5, setPullOp);
            EditorPreload.gpioPull(GPIO_US_ECHO_6, setPullOp);
            EditorPreload.gpioPull(GPIO_US_ECHO_7, setPullOp);
            EditorPreload.gpioPull(GPIO_US_ECHO_8, setPullOp);
            EditorPreload.gpioPull(GPIO_US_ECHO_9, setPullOp);
        }

        // Methode zum Messen der Entfernung
        secondsSinceEpoch() {
            return new Date / 1000 | 0;
        }
        measureDistance1(args, util) {
            const uvpin = Cast.toNumber(args.UVPIN);

            let echoPinArgs = {
                GPIO: uvpin,
                PULL: 'low'
            }
            this.setPull(echoPinArgs); // Setzt den Echo input pin auf LOW
            let pinArgs = {
                GPIO: triggerPin,
                HILO: 'low'
            }
            this.setGpio(pinArgs); // Setzt den Trigger auf LOW

            // Sendet einen Ultraschallimpuls
            pinArgs = {
                GPIO: triggerPin,
                HILO: 'high'
            }
            this.setGpio(pinArgs); // Setzt den Trigger auf LOW nach den 10 Mikrosekunden
            let durationArgs = {
                // DURATION: 0.00001
                DURATION: 0.1
            }

            this.waitForTime(util, durationArgs); // für 10 Mikrosekunden

            pinArgs = {
                GPIO: triggerPin,
                HILO: 'low'
            }

            let echoPinHigh = {
                GPIO: triggerPin,
                HILO: 'high'
            }
            this.setGpio(pinArgs); // Setzt den Trigger auf LOW nach den 10 Mikrosekunden
            let waitArgs = {
                CONDITION: this.getGpio(echoPinHigh),
            }
            let echoStart = runtime.currentMSecs;

            this.waitForEchoPin(util, uvpin, "high");
            this.setPull(echoPinArgs);
            echoEnd = runtime.currentMSecs;

            let elapsed = echoEnd - echoStart;

            let distance = (elapsed * SPEED_OF_SOUND) / 2
            console.log("DISTANCE:" + distance);
            util.yield();
        }

        waitForEchoPin1(util, pinNumber, hilo) {
            let getgpioArgs = {
                GPIO: pinNumber,
                HILO: hilo
            };
            if (this.getGpio(getgpioArgs)) {
                util.yield();
            }

        }
        waitForTime1(util, args) {

            if (util.stackTimerNeedsInit()) {
                const duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));

                util.startStackTimer(duration);
                this.runtime.requestRedraw();
                util.yield();
            } else if (!util.stackTimerFinished()) {
                util.yield();
            }

        }

        getInfo() {
            return {
                id: 'gpioExtension',
                color1: "#0E9D59",
                name: 'SIDEKICK-Blöcke',
                blockIconURI: blockIconURI,
                blocks: [

                    "---",

                    {
                        blockType: Scratch.BlockType.XML,
                        xml: "<sep gap='24'/><label text='GPIO-Pin-Blöcke'/><sep gap='6'/>",
                    },

                    {
                        opcode: 'whenGpio',
                        text: 'Wenn GPIO-Pin [GPIO] den Zustand [HILO] hat',
                        blockType: BlockType.HAT,
                        arguments: {
                            GPIO: {
                                type: ArgumentType.STRING,
                                menu: 'gpios',
                                defaultValue: '0'
                            },
                            HILO: {
                                type: ArgumentType.STRING,
                                menu: 'hilo',
                                defaultValue: 'high'
                            }
                        }
                    },
                    {
                        opcode: 'getGpio',
                        text: 'Ist am GPIO-Pin [GPIO] der Zustand [HILO]?',
                        blockType: BlockType.BOOLEAN,
                        arguments: {
                            GPIO: {
                                type: ArgumentType.STRING,
                                menu: 'gpios',
                                defaultValue: '0'
                            },
                            HILO: {
                                type: ArgumentType.STRING,
                                menu: 'hilo',
                                defaultValue: 'high'
                            }
                        }
                    },
                    {
                        opcode: 'setGpio',
                        text: 'Setze von GPIO-Pin [GPIO] den Output zu [HILO]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            GPIO: {
                                type: ArgumentType.STRING,
                                menu: 'gpios',
                                defaultValue: '0'
                            },
                            HILO: {
                                type: ArgumentType.STRING,
                                menu: 'hilo',
                                defaultValue: 'high'
                            }
                        }
                    },
                    {
                        opcode: 'setPull',
                        text: 'Setze von GPIO-Pin [GPIO] den Input zu [PULL]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            GPIO: {
                                type: ArgumentType.STRING,
                                menu: 'gpios',
                                defaultValue: '0'
                            },
                            PULL: {
                                type: ArgumentType.STRING,
                                menu: 'pull',
                                defaultValue: 'high'
                            }
                        }
                    },

                    "---",

                    {
                        blockType: Scratch.BlockType.XML,
                        xml: "<sep gap='24'/><label text='Ablauf-Blöcke'/><sep gap='6'/>",
                    },

                    {
                        opcode: 'startWhenTrue',
                        text: 'Wenn [CONDITION]',
                        blockType: BlockType.HAT,
                        arguments: {
                            CONDITION: {
                                type: ArgumentType.BOOLEAN,
                                defaultValue: '',
                                acceptReporters: true
                            }
                            // ,
                            // VALUE: {
                            //     type: ArgumentType.STRING,
                            //     defaultValue: '',
                            //     acceptReporters: true
                            // }
                        }
                    },
                    {
                        opcode: 'waitUntilTrueCondition',
                        text: 'Warte bis [CONDITION]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            CONDITION: {
                                type: ArgumentType.BOOLEAN,
                                defaultValue: '',
                                acceptReporters: true
                            }
                            // ,
                            // VALUE: {
                            //     type: ArgumentType.STRING,
                            //     defaultValue: '',
                            //     acceptReporters: true
                            // }
                        }
                    },

                    {
                        opcode: 'waitUntil',
                        text: 'Warte bis [CONDITION]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            CONDITION: {
                                type: ArgumentType.BOOLEAN,
                                defaultValue: '',
                                acceptReporters: true
                            }
                            // ,
                            // VALUE: {
                            //     type: ArgumentType.STRING,
                            //     defaultValue: '',
                            //     acceptReporters: true
                            // }
                        }
                    },

                    {
                        opcode: 'waitForSeconds',
                        text: 'Warte [DURATION] Sekunden',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            DURATION: {
                                type: ArgumentType.STRING,
                                defaultValue: '1'
                            }
                        }
                    },

                    {
                        opcode: 'compareConditions',
                        text: 'Ist [VALUE1] = [VALUE2]?',
                        blockType: BlockType.BOOLEAN,
                        arguments: {
                            VALUE1: {
                                type: ArgumentType.STRING,
                                defaultValue: '',
                                acceptReporters: true
                            },
                            VALUE2: {
                                type: ArgumentType.STRING,
                                defaultValue: '',
                                acceptReporters: true
                            }
                        }
                    },

                    {
                        opcode: 'setStep',
                        text: 'Setze Assistenzschritt auf [STEP]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            STEP: {
                                type: ArgumentType.STRING,
                                defaultValue: '1'
                            }
                        }
                    },

                    {
                        opcode: 'modifyAssistanceStep',
                        text: '[OPERATION] Assistenzschritt um [STEP]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            STEP: {
                                type: ArgumentType.STRING,
                                defaultValue: '1'
                            },
                            OPERATION: {
                                type: ArgumentType.STRING,
                                // defaultValue: '1'
                                menu: 'assistanceStepOperation',
                                defaultValue: '+'
                            }
                        }
                    },
                    {
                        opcode: 'getStep',
                        text: 'Aktueller Assistenzschritt',
                        blockType: BlockType.REPORTER
                    },
                    // {
                    //     opcode: 'whenStep',
                    //     text: 'Wenn Assistenzschritt = [STEP]',
                    //     blockType: BlockType.HAT,
                    //     arguments: {
                    //         STEP: {
                    //             type: ArgumentType.STRING,
                    //             defaultValue: '1'
                    //         }
                    //     }
                    // },

                    // {
                    //     opcode: 'waitUntilTrue',
                    //     text: 'Warte bis [CONDITION]',
                    //     blockType: BlockType.COMMAND,
                    //     arguments: {
                    //         CONDITION: {
                    //             defaultValue: '',
                    //             acceptReporters: true
                    //         }
                    //     }
                    // },




                    "---",

                    {
                        blockType: Scratch.BlockType.XML,
                        xml: "<sep gap='24'/><label text='LED-Blöcke'/><sep gap='6'/>",
                    },

                    {
                        opcode: 'controlLEDStripColour',
                        text: 'Setze LED-Streifen [STRIP] auf Farbe [COLOR] (Länge: [LENGTH]).',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            STRIP: {
                                type: ArgumentType.STRING,
                                menu: 'stripNumber',
                                defaultValue: '1'
                            },
                            LENGTH: {
                                type: ArgumentType.STRING,
                                menu: 'stripLength',
                                defaultValue: '7'
                            },
                            START: {
                                type: ArgumentType.STRING,
                                menu: 'pixelStart',
                                defaultValue: '1'
                            },
                            END: {
                                type: ArgumentType.STRING,
                                menu: 'pixelEnd',
                                defaultValue: '7'
                            },
                            COLOR: {
                                type: ArgumentType.COLOR,
                                defaultValue: '#FFFFFF'
                            },
                            COLORBACKGROUND: {
                                type: ArgumentType.COLOR,
                                defaultValue: '#0069AF'
                            },
                            RESET: {
                                type: ArgumentType.STRING,
                                menu: 'resetStripColours',
                                defaultValue: 'Ja'
                            },
                        }
                    },
                    {
                        opcode: 'setAllLEDStripColours',
                        text: 'Setze alle LED-Streifen (Anzahl: [COUNT]) auf Farbe [COLOR]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            COUNT: {
                                type: ArgumentType.STRING,
                                menu: 'stripCount',
                                defaultValue: '9'
                            },
                            COLOR: {
                                type: ArgumentType.COLOR,
                                defaultValue: '#000000'
                            }
                        }
                    },

                    "---",

                    {
                        blockType: Scratch.BlockType.XML,
                        xml: "<sep gap='24'/><label text='UV-Sensor-Blöcke'/><sep gap='6'/>",
                    },

                    {
                        opcode: "getSensorState",
                        blockType: Scratch.BlockType.BOOLEAN,
                        // text: Scratch.translate("open a file as [as]"),
                        // text: "Ist Sensor [SENSOR] [HILO]?",
                        text: "Ist UV-Sensor [SENSOR] ausgelöst?",
                        arguments: {
                            // HILO: {
                            //     type: Scratch.ArgumentType.STRING,
                            //     menu: "hiloSensor",
                            //     defaultValue: '1'
                            // },
                            SENSOR: {
                                type: ArgumentType.STRING,
                                menu: 'uvSensorNumber',
                                defaultValue: '18'
                            }
                        },
                    },

                    /*
                    {
                        opcode: 'whenUVSensor85',
                        text: 'Wenn die Entfernung zu UV-Sensor [UVNUMBER] kleiner als [DISTANCE] cm ist',
                        blockType: BlockType.COMMAND,
                        arguments: {

                            UVNUMBER: {
                                type: ArgumentType.STRING,
                                menu: 'uvSensorNumber2',
                                defaultValue: '0'
                            },
                            DISTANCE: {
                                type: ArgumentType.STRING,
                                defaultValue: '10'
                            }

                        }
                    },
                    */

                    "---",

                    {
                        blockType: Scratch.BlockType.XML,
                        xml: "<sep gap='24'/><label text='Button-Blöcke'/><sep gap='6'/>",
                    },

                    // {
                    //     opcode: 'whenButtonPressed',
                    //     text: 'Wenn Button [BUTTON] [HILO] wurde',
                    //     blockType: BlockType.HAT,
                    //     arguments: {
                    //         HILO: {
                    //             type: ArgumentType.STRING,
                    //             menu: 'hiloButton',
                    //             defaultValue: '1'
                    //         },
                    //         BUTTON: {
                    //             type: ArgumentType.STRING,
                    //             menu: 'buttonNumber',
                    //             defaultValue: '4'
                    //         }
                    //     }
                    // },

                    {
                        opcode: "buttonState",
                        blockType: Scratch.BlockType.BOOLEAN,
                        // text: Scratch.translate("open a file as [as]"),
                        text: "Ist Button [BUTTON] [HILO]?",
                        arguments: {
                            HILO: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "hiloButton",
                                defaultValue: '1'
                            },
                            BUTTON: {
                                type: ArgumentType.STRING,
                                menu: 'buttonNumber',
                                defaultValue: '4'
                            }
                        },
                    },

                    "---",

                    {
                        blockType: Scratch.BlockType.XML,
                        xml: "<sep gap='24'/><label text='Video-Blöcke'/><sep gap='6'/>",
                    },
                    {
                        opcode: "loadVideoURL",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "⏏ Importiere Video „[NAME].[FORMAT]“",
                        arguments: {
                            FORMAT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'videoFormats',
                                defaultValue: 'MOV',
                            },
                            TARGET: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "targets",
                            },
                            NAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "video-name",
                            },
                        },
                    },
                    {
                        opcode: "showVideoAndPlay",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "⏵ Starte Video [NAME] auf [TARGET]",
                        arguments: {
                            TARGET: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "targets",
                            },
                            NAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "video-name",
                            },
                        },
                    },

                    {
                        opcode: "pause",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "⏸ Pausiere Video [NAME]",
                        arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "video-name",
                            },
                        },
                    },
                    {
                        opcode: "resume",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "⏵ Setze Video [NAME] fort",
                        arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "video-name",
                            },
                        },
                    },
                    {
                        opcode: "deleteVideoURL",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "⏹ Schließe Video [NAME]",
                        arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "video-name",
                            },
                        },
                    },
                    /*
                    {
                        opcode: "measureDistance",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "measureDistance [UVPIN]",


                        arguments: {

                            UVPIN: {
                                type: ArgumentType.STRING,
                                menu: 'uvSensorNumber',
                                defaultValue: '18'
                            }
                        }
                    },
                    */
                ],
                menus: {
                    targets: {
                        acceptReporters: true,
                        items: "_getTargets",
                    },
                    state: {
                        acceptReporters: true,
                        items: ["playing", "paused"],
                    },
                    attribute: {
                        acceptReporters: false,
                        items: ["current time", "duration", "volume", "width", "height"],
                    },

                    resizeMenu: {
                        acceptReporters: true,
                        items: ["scale", "viewport"],
                    },
                    gpios: {
                        acceptReporters: true,
                        // eslint-disable-next-line max-len
                        items: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27']
                    },
                    stripCount: {
                        // eslint-disable-next-line max-len
                        items: ['1', '2', '3', '4', '5', '6', '7', '8', '9']
                    },
                    hiloButton: {
                        // eslint-disable-next-line max-len
                        items:
                            [
                                { text: 'gedrückt', value: '1' },
                                { text: 'losgelassen', value: '0' }
                            ]
                    },

                    hiloSensor: {
                        // eslint-disable-next-line max-len
                        items:
                            [
                                { text: 'ausgelöst', value: '1' },
                                { text: 'nicht ausgelöst', value: '0' }
                            ]
                    },
                    
                    buttonNumber: {
                        // eslint-disable-next-line max-len
                        items: [
                            { text: '1', value: '4' },
                            { text: '2', value: '17' },
                            { text: '3', value: '27' },
                            { text: '4', value: '22' },]
                    },
                    uvSensorNumber: {
                        // eslint-disable-next-line max-len
                        items: [
                            { text: '1', value: '18' },
                            { text: '2', value: '23' },
                            { text: '3', value: '24' },
                            { text: '4', value: '5' },
                            { text: '5', value: '11' },
                            { text: '6', value: '9' },
                            { text: '7', value: '6' },
                            { text: '8', value: '13' },
                            { text: '9', value: '19' }
                        ]
                    },
                    stripNumber: {
                        // eslint-disable-next-line max-len
                        items: [{ text: '1', value: '1' },
                        { text: '2', value: '2' },
                        { text: '3', value: '3' },
                        { text: '4', value: '4' },
                        { text: '5', value: '5' },
                        { text: '6', value: '6' },
                        { text: '7', value: '7' },
                        { text: '8', value: '8' },
                        { text: '9', value: '9' }]
                    },
                    stripLength: {
                        // eslint-disable-next-line max-len
                        items: [{ text: '1', value: '1' },
                        { text: '2', value: '2' },
                        { text: '3', value: '3' },
                        { text: '4', value: '4' },
                        { text: '5', value: '5' },
                        { text: '6', value: '6' },
                        { text: '7', value: '7' },]

                    },
                    uvSensorNumber1: {
                        acceptReporters: true,
                        items: [
                            { text: '1', value: '18' },
                            { text: '2', value: '23' },
                            { text: '3', value: '24' },
                            { text: '4', value: '5' },
                            { text: '5', value: '11' },
                            { text: '6', value: '9' },
                            { text: '7', value: '6' },
                            { text: '8', value: '13' },
                            { text: '9', value: '19' }
                        ]
                    },
                    uvSensorNumber2: {
                        acceptReporters: true,
                        items: [
                            { text: '1', value: '0' },
                            { text: '2', value: '1' },
                            { text: '3', value: '2' },
                            { text: '4', value: '3' },
                            { text: '5', value: '4' },
                            { text: '6', value: '5' },
                            { text: '7', value: '6' },
                            { text: '8', value: '7' },
                            { text: '9', value: '8' }
                        ]
                    },
                    videoFormats: {
                        items: [
                            { text: 'mov', value: 'MOV' },
                            { text: 'mp4', value: 'mp4' },]
                    },
                    pixelStart: {
                        // eslint-disable-next-line max-len
                        items: ['1', '2', '3', '4', '5', '6', '7']
                    },
                    pixelEnd: {
                        // eslint-disable-next-line max-len
                        items: ['1', '2', '3', '4', '5', '6', '7']
                    },
                    scriptCommand: {
                        items: ['sudo', '']
                    },
                    scriptType: {
                        items: ['python3', 'node']
                    },
                    hilo: {
                        items: [{
                            text: 'high',
                            value: 'high'
                        }, {
                            text: 'low',
                            value: 'low'
                        }]
                    },
                    pull: {
                        items: [{
                            text: 'pulled high',
                            value: 'high'
                        }, {
                            text: 'pulled low',
                            value: 'low'
                        }, {
                            text: 'not pulled',
                            value: 'none'
                        }]
                    },
                    assistanceStepOperation: {
                        items: [{
                            text: 'erhöhe',
                            value: '+'
                        }, {
                            text: 'verringere',
                            value: '-'
                        }]
                    },
                    resetStripColours: {
                        items: [{
                            text: 'Ja',
                            value: 'Ja'
                        }, {
                            text: 'Nein',
                            value: 'Nein'
                        }]
                    }
                }
            };
        } // Get pin state (leave pin as input/output)

        setStep(args) {
            const step = Cast.toNumber(args.STEP);

            currentStep = step;
        }


        modifyAssistanceStep(args) {
            const step = Cast.toNumber(args.STEP);
            const operation = Cast.toString(args.OPERATION);

            if (operation === '+') {
                currentStep += step;
            } else if (operation === '-') {
                currentStep -= step;
                if (currentStep < 0) {
                    currentStep = 0;
                }
            }
            // currentStep = step;
        }


        getStep() {
            return currentStep;
        }

        whenStep(args) {
            const step = Cast.toNumber(args.STEP);

            return step === currentStep;
        } // Get pin state (leave pin as input/output)

        whenGpio(args) {
            const pin = Cast.toNumber(args.GPIO);
            const val = Cast.toString(args.HILO);
            // const state = gpio.get(pin, -1, -1); // Get state of pin, leave pin as input/output, leave pull state
            const state = EditorPreload.gpioGet(pin, -1, -1); //11 Get state of pin, leave pin as input/output, leave pull state

            let binary = 0;
            if (val === 'high') binary = 1;
            return state === binary;
        } // Get pin state (leave pin as input/output)

        whenButtonPressed(args) {
            const buttonPinNumber = Cast.toNumber(args.BUTTON);
            const buttonWatchedState = Cast.toString(args.HILO);
            console.log("buttonPinNumber" + buttonPinNumber);
            console.log("buttonWatchedState" + buttonWatchedState);

            // Get pin state, set pin as input, make pull up
            const buttonPinState = EditorPreload.gpioGet(buttonPinNumber, 0, 2);

            if (buttonPinState == 1) {
                if (buttonWatchedState == '0') return true;
                else return false;
            } else {
                if (buttonWatchedState == '1') return true;
                else return false;
            }
        }

        buttonState(args) {
            const buttonPinNumber = Cast.toNumber(args.BUTTON);
            const buttonWatchedState = Cast.toString(args.HILO);
            console.log("buttonPinNumber" + buttonPinNumber);
            console.log("buttonWatchedState" + buttonWatchedState);

            // Get pin state, set pin as input, make pull up
            const buttonPinState = EditorPreload.gpioGet(buttonPinNumber, 0, 2);

            if (buttonPinState == 1) {
                if (buttonWatchedState == '0') return true;
                else return false;
            } else {
                if (buttonWatchedState == '1') return true;
                else return false;
            }
        }


        measureDistance(args, util) {

            // triggerpin zu out und low
            const GPIO_US_TRIGGER = 25;
            let setGpioDriveDown = 0;
            let setGpioDriveUp = 1;
            EditorPreload.gpioSet(GPIO_US_TRIGGER, setGpioDriveDown);

            // alle echopin zu in und low
            let setPullOpDown = 1; // 1 --> low
            let setPullOpUp = 2; // 2 --> high
            const GPIO_US_ECHO_THIS = Cast.toNumber(args.UVPIN);
            let INDEX_PIN_US_ECHO_THIS = 0;

            switch (GPIO_US_ECHO_THIS) {
                case 18:
                    INDEX_PIN_US_ECHO_THIS = 0;
                case 23:
                    INDEX_PIN_US_ECHO_THIS = 1;
                case 24:
                    INDEX_PIN_US_ECHO_THIS = 2;
                case 5:
                    INDEX_PIN_US_ECHO_THIS = 3;
                case 11:
                    INDEX_PIN_US_ECHO_THIS = 4;
                case 9:
                    INDEX_PIN_US_ECHO_THIS = 5;
                case 6:
                    INDEX_PIN_US_ECHO_THIS = 6;
                case 13:
                    INDEX_PIN_US_ECHO_THIS = 7;
                case 19:
                    INDEX_PIN_US_ECHO_THIS = 8;
                default:
                    INDEX_PIN_US_ECHO_THIS = 0;
                // return 0;
            }

            EditorPreload.gpioPull(GPIO_US_ECHO_THIS, setPullOpDown);

            //  set ultrasonic trigger pin to true for 10 us
            EditorPreload.gpioSet(GPIO_US_TRIGGER, setGpioDriveUp);
            let durationArgs = {
                DURATION: 0.00001
                // DURATION: 0.1
            }

            this.waitForTime(util, durationArgs); // fuer 10 Mikrosekunden

            EditorPreload.gpioSet(GPIO_US_TRIGGER, setGpioDriveDown);

            let thisVergangeneZeit = 0;
            let thisDistance = 0;
            let currentTime = performance.now();

            waitForEchoPinStartFlag[INDEX_PIN_US_ECHO_THIS] = false;

            waitForEchoPinTimeElapsed[INDEX_PIN_US_ECHO_THIS] = 0;
            waitForEchoPinTimeStart[INDEX_PIN_US_ECHO_THIS] = 0;
            waitForEchoPinTimeEnd[INDEX_PIN_US_ECHO_THIS] = 0;
            this.waitForEchoPin(util, currentTime, INDEX_PIN_US_ECHO_THIS, GPIO_US_ECHO_THIS);

            thisVergangeneZeit = waitForEchoPinTimeEnd[INDEX_PIN_US_ECHO_THIS] - waitForEchoPinTimeStart[INDEX_PIN_US_ECHO_THIS];
            thisDistance = (thisVergangeneZeit * SPEED_OF_SOUND) / 2

            console.log(waitForEchoPinTimeEnd[INDEX_PIN_US_ECHO_THIS] + " " + waitForEchoPinTimeStart[INDEX_PIN_US_ECHO_THIS]);
            console.log("DISTANCE:" + thisDistance);
            util.yield();
        }
        waitForEchoPin(util, currentTime, pinIndex, gpioNumber) {

            if (waitForEchoPinTimeElapsed[pinIndex] <= 0.05) {

                if (EditorPreload.gpioGet(gpioNumber, -1, -1) == 1 && !waitForEchoPinStartFlag[pinIndex]) {
                    waitForEchoPinTimeStart[pinIndex] = performance.now();
                    waitForEchoPinStartFlag[pinIndex] = true;

                }
                if (EditorPreload.gpioGet(gpioNumber, -1, -1) == 0 && waitForEchoPinStartFlag[pinIndex]) {
                    waitForEchoPinTimeEnd[pinIndex] = performance.now();
                    waitForEchoPinStartFlag[pinIndex] = false;
                }

                waitForEchoPinTimeElapsed[pinIndex] = performance.now() - currentTime;
                util.yield();
            }
            // setzen von startZeit, wenn  echopin == 1 ist
            // setzen von endZeit, wenn  echopin == 0 ist

            waitForEchoPinTimeElapsed[pinIndex] = 0;
        }
        waitForTime(util, args) {

            if (util.stackTimerNeedsInit()) {
                const duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));

                util.startStackTimer(duration);
                this.runtime.requestRedraw();
                util.yield();
            } else if (!util.stackTimerFinished()) {
                util.yield();
            }

        }

        getGpio(args) {
            const pin = Cast.toNumber(args.GPIO);
            const val = Cast.toString(args.HILO);

            // pin, io, pull
            // Get pin state, set pin as input (0) / output (1), make pull up (2) / down (1) / none (0) / unset (-1)
            const state = EditorPreload.gpioGet(pin, -1, -1);
            let binary = 0;
            if (val === 'high') binary = 1;
            return state === binary;
        } // Set pin as output and set drive

        setGpio(args) {
            let drive = 0;
            const pin = Cast.toNumber(args.GPIO);
            if (Cast.toString(args.HILO) === 'high') drive = 1;
            EditorPreload.gpioSet(pin, drive);
        } // Set pin as input, and set pull paramter

        setPull(args) {
            const pin = Cast.toNumber(args.GPIO);
            const val = Cast.toString(args.PULL);
            let op = 2;
            if (val === 'low') op = 1;
            if (val === 'none') op = 0;
            EditorPreload.gpioPull(pin, op);
        }

        startProgram(args) {

            EditorPreload.gpioSet(4, 1);

            // "sudo"
            const scriptCommand = 'sudo';
            // "python3"
            let scriptType = 'python3';
            let scriptName = 'ScratchConnect.py';

            let scriptArgs = [scriptType, scriptName];

            // #!/bin/sh
            // sudo python3 ~/Sidekick/python/ScratchConnect.py
            let sudoScriptSynchronous = "0";
            let sudoScriptCall = "1";
            let sudoScriptCommand = scriptType;
            let sudoScriptName = scriptName;
            let sudoScriptArguments = [""];

            const state = EditorPreload.sudoScript(sudoScriptSynchronous, sudoScriptCall, sudoScriptCommand, sudoScriptName, sudoScriptArguments);
        }

        controlLEDStripColour(args) {

            const ledStripNumber = Cast.toNumber(args.STRIP);
            const ledStripLength = Cast.toNumber(args.LENGTH);

            const hexColor = Cast.toString(args.COLOR);

            const NUM_LEDS_PER_STRIP = 7;
            const NUM_LEDS = 70;

            const ledStripNumberIndex = ledStripNumber - 1;

            const ledStartIndex = (NUM_LEDS_PER_STRIP * ledStripNumberIndex);
            const ledEndIndex = (ledStartIndex + ledStripLength) - 1;

            // https://sentry.io/answers/how-to-insert-an-item-into-an-array-at-a-specific-index-using-javascript/
            for (let i = ledStartIndex; i <= ledEndIndex; i++) {
                let hexColorShort = hexColor.slice(1);
                let decimalColor = this.hex2Decimal(hexColorShort);
                pixelColor[i] = decimalColor;
            }

            const sudoScriptArgumentsChangeColour = [NUM_LEDS, ...pixelColor];
            const stateSetColour = EditorPreload.sudoScript("1", "1", "node", "ws281x-control.js", sudoScriptArgumentsChangeColour);
        }

        setAllLEDStripColours(args) {

            const ledStripCount = Cast.toNumber(args.COUNT);

            const hexColor = Cast.toString(args.COLOR);

            const NUM_LEDS = 7;
            const NUM_PIXEL_TO_SET = 7 * ledStripCount;
            const numPixelToSetIndex = NUM_PIXEL_TO_SET - 1;

            for (let i = 0; i <= numPixelToSetIndex; i++) {
                let hexColorShort = hexColor.slice(1);
                let decimalColor = this.hex2Decimal(hexColorShort);
                pixelColor[i] = decimalColor;
            }

            const sudoScriptArgumentsChangeColour = [70, ...pixelColor];
            const stateSetColour = EditorPreload.sudoScript("1", "1", "node", "ws281x-control.js", sudoScriptArgumentsChangeColour);
        }

        whenKeyAction(args, util) {

            let key = args.UVNUMBER;
            // Convert the key arg, if it is a KEY_ID, to the key name used by
            // the Keyboard io module.
            if (SCRATCH_KEY_NAME[args.UVNUMBER]) {
                key = SCRATCH_KEY_NAME[args.UVNUMBER];
            }
            const isDown = util.ioQuery('keyboard', 'getKeyIsDown', [key]);
            return (isDown)
        }

        pauseBrowser(millis, util) {
            var date = performance.now();
            var curDate = null;
            if (curDate - date < millis) {
                curDate = performance.now();
                util.yield();
            }
        }

        waitUntilAsLong1(thing, util) {
            const condition = Cast.toBoolean(thing);
            if (condition) {
                util.yield();
            }
        }

        whenUVSensor10(args, util) {
            const state = EditorPreload.sudoScript(sudoScriptSynchronous, sudoScriptCall, sudoScriptCommand, sudoScriptName, sudoScriptArguments);
            const uvSensorDistance = EditorPreload.sudoScript("1", "1", "node", "uv-control.js", sudoScriptArgumentsWhenUVSensorNumber);
        }

        whenUVSensor9(args, util) {

            let pulseStart = 0;
            let pulseEnd = 0;
            let pulseDuration = 0;
            let distance = 0;
            const GPIO_US_TRIGGER = 25;
            const GPIO_US_ECHO = 18;

            EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);
            EditorPreload.gpioPull(GPIO_US_ECHO, 1);

            EditorPreload.gpioSet(GPIO_US_TRIGGER, 1);

            this.pauseBrowser(0.01, util);

            EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);

            if (EditorPreload.gpioGet(GPIO_US_ECHO) == 0) {
                pulseStart = performance.now();
                util.yield();

            }
            if (EditorPreload.gpioGet(GPIO_US_ECHO) == 1) {
                pulseEnd = performance.now();
                util.yield();
            }

            pulseDuration = pulseEnd - pulseStart;
            distance = pulseDuration * 34.3 / 2;
            console.log("distance: " + distance);

            return distance <= 10;
        }

        whenUVSensor8(args, util) {

            const GPIO_US_TRIGGER = 25;

            const INDEX_PIN_US_ECHO_THIS = Cast.toNumber(args.UVNUMBER);

            const GPIO_US_ECHO = gpioNumbersEchoPin[INDEX_PIN_US_ECHO_THIS];

            if (!waitingAfterTrigger[INDEX_PIN_US_ECHO_THIS]) {

                if (!waitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS]) {
                    EditorPreload.gpioPull(GPIO_US_ECHO, 0);
                    EditorPreload.gpioSet(GPIO_US_TRIGGER, 1);
                    waitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = true;
                    this.waitfortheSeconds(util, 0.00001, INDEX_PIN_US_ECHO_THIS);

                    console.log("1");
                }

                if (waitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] && finishedWaitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS]) {

                    EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);
                    waitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = false;
                    waitingAfterTrigger[INDEX_PIN_US_ECHO_THIS] = true;
                    finishedWaitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = false;
                    console.log("2");

                }
            }

            if (waitingAfterTrigger[INDEX_PIN_US_ECHO_THIS] && !startTimeChanged[INDEX_PIN_US_ECHO_THIS]) {
                pulseStart[INDEX_PIN_US_ECHO_THIS] = this.waitfortheThing(util, GPIO_US_ECHO, 1, INDEX_PIN_US_ECHO_THIS, "start");
                console.log("3");
            }

            if (waitingAfterTrigger[INDEX_PIN_US_ECHO_THIS] && startTimeChanged[INDEX_PIN_US_ECHO_THIS] && !endTimeChanged[INDEX_PIN_US_ECHO_THIS]) {
                pulseEnd[INDEX_PIN_US_ECHO_THIS] = this.waitfortheThing(util, GPIO_US_ECHO, 0, INDEX_PIN_US_ECHO_THIS, "end");
                console.log("4");
            }


            if (waitingAfterTrigger[INDEX_PIN_US_ECHO_THIS] && startTimeChanged[INDEX_PIN_US_ECHO_THIS] && endTimeChanged[INDEX_PIN_US_ECHO_THIS]) {

                pulseDuration[INDEX_PIN_US_ECHO_THIS] = pulseEnd[INDEX_PIN_US_ECHO_THIS] - pulseStart[INDEX_PIN_US_ECHO_THIS];
                distance[INDEX_PIN_US_ECHO_THIS] = pulseDuration[INDEX_PIN_US_ECHO_THIS] * 34.3 / 2;
                console.log("distance: " + distance[INDEX_PIN_US_ECHO_THIS]);

                this.waitfortheSeconds(util, 0.05, INDEX_PIN_US_ECHO_THIS);

                console.log("5");

                if (finishedWaitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS]) {

                    finishedWaitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = false;
                    waitingAfterTrigger[INDEX_PIN_US_ECHO_THIS] = false;
                    startTimeChanged[INDEX_PIN_US_ECHO_THIS] = false;
                    endTimeChanged[INDEX_PIN_US_ECHO_THIS] = false;

                    EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);
                    EditorPreload.gpioPull(GPIO_US_ECHO, 0);
                    console.log("6");

                    return distance[INDEX_PIN_US_ECHO_THIS] <= 10;
                }
            }
            console.log("false");

            return false;
        }

        whenUVSensor85(args, util) {

            let sudoScriptSynchronous = "1";
            let sudoScriptCall = "1";
            let sudoScriptCommand = "python3";
            let sudoScriptName = "~/Sidekick/python/ScratchConnect.py";
            const state = EditorPreload.sudoScript(sudoScriptSynchronous, sudoScriptCall, sudoScriptCommand, sudoScriptName)
        }
        whenUVSensor84(args, util) {
            if (notChecking) {
                notChecking = false;
                checkedStart = false;
                checkedEnd = false;
                const GPIO_US_TRIGGER = 25;
                EditorPreload.gpioPull(18, 0);
                EditorPreload.gpioSet(GPIO_US_TRIGGER, 1);

                if (util.stackTimerNeedsInit()) {
                    let duration = Math.max(0, 1000 * Cast.toNumber(0.00001));
                    util.startStackTimer(duration);
                    this.runtime.requestRedraw();
                    util.yield();
                } else if (!util.stackTimerFinished()) {
                    util.yield();
                }

                EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);

            }
            if (this.checkGPIOInput(18, 1) && !checkedStart) {
                timeCheckedStart = performance.now();
                checkedStart = true;

            }
            if (this.checkGPIOInput(18, 0) && checkedStart && !checkedEnd) {
                timeCheckedEnd = performance.now();
                checkedEnd = true;
            }

            console.log("distance" + ((timeCheckedStart - timeCheckedEnd) * SPEED_OF_SOUND) / 2);
            notChecking = true;
        }

        checkGPIOInput(echoPinUS, valueOfEchoPin) {
            if (EditorPreload.gpioGet(echoPinUS) == valueOfEchoPin) {
                console.log("pin " + echoPinUS + "is " + valueOfEchoPin);
                return true;
            }
            return false;
        }

        whenUVSensor83(args, util) {

            const GPIO_US_TRIGGER = 25;

            const INDEX_PIN_US_ECHO_THIS = Cast.toNumber(args.UVNUMBER);

            const GPIO_US_ECHO = gpioNumbersEchoPin[INDEX_PIN_US_ECHO_THIS];

            if (!waitingAfterTrigger[INDEX_PIN_US_ECHO_THIS]) {

                if (!waitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS]) {
                    EditorPreload.gpioPull(GPIO_US_ECHO, 0);
                    EditorPreload.gpioSet(GPIO_US_TRIGGER, 1);
                    waitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = true;
                    this.waitfortheSeconds(util, 0.00001, INDEX_PIN_US_ECHO_THIS);

                    console.log("1");
                }

                else if (waitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] && finishedWaitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS]) {

                    EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);
                    waitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = false;
                    waitingAfterTrigger[INDEX_PIN_US_ECHO_THIS] = true;
                    finishedWaitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = false;
                    console.log("2");
                }
            } else {

                if (!startTimeChanged[INDEX_PIN_US_ECHO_THIS]) {
                    pulseStart[INDEX_PIN_US_ECHO_THIS] = this.waitfortheThing(util, GPIO_US_ECHO, 1, INDEX_PIN_US_ECHO_THIS, "start");
                    console.log("3");
                }

                else if (startTimeChanged[INDEX_PIN_US_ECHO_THIS] && !endTimeChanged[INDEX_PIN_US_ECHO_THIS]) {
                    pulseEnd[INDEX_PIN_US_ECHO_THIS] = this.waitfortheThing(util, GPIO_US_ECHO, 0, INDEX_PIN_US_ECHO_THIS, "end");
                    console.log("4");
                }

                else if (startTimeChanged[INDEX_PIN_US_ECHO_THIS] && endTimeChanged[INDEX_PIN_US_ECHO_THIS]) {

                    pulseDuration[INDEX_PIN_US_ECHO_THIS] = pulseEnd[INDEX_PIN_US_ECHO_THIS] - pulseStart[INDEX_PIN_US_ECHO_THIS];
                    distance[INDEX_PIN_US_ECHO_THIS] = pulseDuration[INDEX_PIN_US_ECHO_THIS] * 34.3 / 2;

                    this.waitfortheSeconds(util, 0.05, INDEX_PIN_US_ECHO_THIS);

                    console.log("5");

                    finishedWaitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = false;
                    waitingAfterTrigger[INDEX_PIN_US_ECHO_THIS] = false;
                    startTimeChanged[INDEX_PIN_US_ECHO_THIS] = false;
                    endTimeChanged[INDEX_PIN_US_ECHO_THIS] = false;


                    EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);
                    EditorPreload.gpioPull(GPIO_US_ECHO, 0);
                    console.log("6");
                    console.log(distance[INDEX_PIN_US_ECHO_THIS]);

                    return distance[INDEX_PIN_US_ECHO_THIS] <= 10;
                }
            }
            console.log("false");

            return false;
        }


        whenUVSensor82(args, util) {

            const GPIO_US_TRIGGER = 25;

            const INDEX_PIN_US_ECHO_THIS = Cast.toNumber(args.UVNUMBER);

            const GPIO_US_ECHO = gpioNumbersEchoPin[INDEX_PIN_US_ECHO_THIS];

            EditorPreload.gpioPull(GPIO_US_ECHO, 0);
            EditorPreload.gpioSet(GPIO_US_TRIGGER, 1);
            waitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = true;

            if (util.stackTimerNeedsInit()) {
                let duration = Math.max(0, 1000 * Cast.toNumber(0.00001));
                util.startStackTimer(duration);
                this.runtime.requestRedraw();
                util.yield();
            } else if (!util.stackTimerFinished()) {
                util.yield();
            }
            finishedWaitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = true;
            console.log("1");

            EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);
            waitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = false;
            waitingAfterTrigger[INDEX_PIN_US_ECHO_THIS] = true;
            finishedWaitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = false;
            console.log("2");

            let startTimeWait;
            startTimeWait = performance.now();
            if (EditorPreload.gpioGet(GPIO_US_ECHO, -1, -1) != 1) {
                startTimeWait = performance.now();
                util.yield();

            } else {
                startTimeChanged[INDEX_PIN_US_ECHO_THIS] = true;

                console.log("3");
            }

            let endTimeWait;
            endTimeWait = performance.now();
            if (EditorPreload.gpioGet(GPIO_US_ECHO, -1, -1) != 0) {
                endTimeWait = performance.now();
                util.yield();
            } else {

                endTimeChanged[INDEX_PIN_US_ECHO_THIS] = true;
                startTimeChanged[INDEX_PIN_US_ECHO_THIS] = false;

                console.log("4");
            }

            pulseDuration[INDEX_PIN_US_ECHO_THIS] = pulseEnd[INDEX_PIN_US_ECHO_THIS] - pulseStart[INDEX_PIN_US_ECHO_THIS];
            distance[INDEX_PIN_US_ECHO_THIS] = pulseDuration[INDEX_PIN_US_ECHO_THIS] * 34.3 / 2;
            console.log("distance: " + distance[INDEX_PIN_US_ECHO_THIS]);

            if (util.stackTimerNeedsInit()) {
                let duration = Math.max(0, 1000 * Cast.toNumber(0.05));
                util.startStackTimer(duration);
                this.runtime.requestRedraw();
                util.yield();
            } else if (!util.stackTimerFinished()) {
                util.yield();
            }
            finishedWaitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = true;
            console.log("1");

            console.log("5");

            finishedWaitingBetweenTrigger[INDEX_PIN_US_ECHO_THIS] = false;
            waitingAfterTrigger[INDEX_PIN_US_ECHO_THIS] = false;
            startTimeChanged[INDEX_PIN_US_ECHO_THIS] = false;
            endTimeChanged[INDEX_PIN_US_ECHO_THIS] = false;

            EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);
            EditorPreload.gpioPull(GPIO_US_ECHO, 0);
            console.log("6");

            console.log("false");
            console.log(distance[INDEX_PIN_US_ECHO_THIS]);

            return false;
        }

        waitfortheThing(util, echoPinUS, valueOfEchoPin, echoPinIndex, startEnd) {
            let timeWait;
            timeWait = performance.now();

            if (EditorPreload.gpioGet(echoPinUS) == valueOfEchoPin) {
                if (startEnd == "start") {
                    startTimeChanged[echoPinIndex] = true;
                } else if (startEnd == "end") {
                    endTimeChanged[echoPinIndex] = true;
                }
                return timeWait;
            } else {
                util.yield();
            }
        }

        waitfortheThing1(util, echoPinUS, valueOfEchoPin) {
            let startTimeWait;
            if (EditorPreload.gpioGet(echoPinUS) == valueOfEchoPin) {
                startTimeWait = performance.now();
                util.yield();
            }
            return startTimeWait;
        }

        waitfortheSeconds(util, seconsToWait, echoPinIndex) {
            if (util.stackTimerNeedsInit()) {
                let duration = Math.max(0, 1000 * Cast.toNumber(seconsToWait));
                util.startStackTimer(duration);
                this.runtime.requestRedraw();
                util.yield();
            } else if (!util.stackTimerFinished()) {
                util.yield();
            }
            finishedWaitingBetweenTrigger[echoPinIndex] = true;
        }

        whenUVSensor7(args, util) {
            const TEMPERATURE = 20;
            const SPEED_OF_SOUND = 33100 + (0.6 * TEMPERATURE);
            let startTime = 0;
            let endTime = 0;
            const GPIO_US_TRIGGER = 25;
            const GPIO_US_ECHO = 18;

            EditorPreload.gpioSet(GPIO_US_TRIGGER, 1);
            if (util.stackTimerNeedsInit()) {
                const duration = Math.max(0, 1000 * Cast.toNumber(0.00001));
                util.startStackTimer(duration);
                this.runtime.requestRedraw();
                util.yield();
            } else if (!util.stackTimerFinished()) {
                util.yield();
            }

            EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);

            if (EditorPreload.gpioGet(GPIO_US_ECHO) == 1) {
                startTime = Date.now();
                util.yield();
            }

            if (EditorPreload.gpioGet(GPIO_US_ECHO) == 0) {
                endTime = Date.now();
                util.yield();
            }

            let elapsed = endTime - startTime;
            let distance = (elapsed * SPEED_OF_SOUND) / 2;

            console.log("distance: " + distance);

            return distance <= 10;
        }

        whenUVSensor6(args, util) {
            const TEMPERATURE = 20;
            const SPEED_OF_SOUND = 33100 + (0.6 * TEMPERATURE);
            let startTime = 0;
            let endTime = 0;
            const GPIO_US_TRIGGER = 25;
            const GPIO_US_ECHO = 18;

            EditorPreload.gpioSet(GPIO_US_TRIGGER, 1);

            if (util.stackTimerNeedsInit()) {
                const duration = Math.max(0, 1000 * Cast.toNumber(0.00001));
                util.startStackTimer(duration);
                this.runtime.requestRedraw();
                util.yield();
            } else if (!util.stackTimerFinished()) {
                util.yield();
            }

            EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);

            let currentTime = Date.now();
            let elapsedTime = 0;

            if ((elapsedTime <= 0.05)) {

                if (EditorPreload.gpioGet(GPIO_US_ECHO, -1, -1) == 1) {
                    startTime = Date.now();

                }

                if (EditorPreload.gpioGet(GPIO_US_ECHO, -1, -1) == 0) {
                    endTime = Date.now();

                }

                elapsedTime = Date.now() - currentTime;
                util.yield();
            }

            let elapsed = endTime - startTime;
            let distance = (elapsed * SPEED_OF_SOUND) / 2;

            console.log("distance: " + distance);

            return distance <= 10;
        }

        whenUVSensor5(args) {

            EditorPreload.gpioSet(25, 0);

            EditorPreload.gpioPull(18, 1);


            EditorPreload.gpioSet(25, 1);

            this.waitForMilliseconds(0.01);

            EditorPreload.gpioSet(25, 0);

            console.log("GPIO 18: " + EditorPreload.gpioGet(18, 0, 1));
        }


        waitForMilliseconds(millis) {
            return new Promise((resolve, reject) => {
                const timeInMilliseconds = millis * 1000;
                setTimeout(() => {
                    resolve();
                }, timeInMilliseconds);
            });
        }

        async whenUVSensor3() {
            const GPIO_US_ECHO = 18;
            const TEMPERATURE = 20;
            const SPEED_OF_SOUND = 33100 + (0.6 * TEMPERATURE);
            const GPIO_US_TRIGGER = 25;

            let startTime = 0;
            let endTime = 0;
            let elapsed = 0;
            let distance = 0;
            let StartFlag = false;

            let start = performance.now();
            elapsed = 0;

            EditorPreload.gpioSet(GPIO_US_TRIGGER, 1);
            await pauseBrowser(1000)
            EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);

            console.log("GPIO_US_ECHO" + EditorPreload.gpioGet(GPIO_US_ECHO, 0, 1));

            elapsed = endTime - startTime;
            distance = elapsed * 34.3 / 2;

            return distance <= 10;
        }

        // func input: 0, func output: 1, func unset: -1
        // pull up: 2, pull down: 1, pull none: 0, pull unset: -1
        // drive high: 1, drive low: 0, drive unset: -1
        whenUVSensor2() {
            const GPIO_US_ECHO = 18;
            const TEMPERATURE = 20;
            const SPEED_OF_SOUND = 33100 + (0.6 * TEMPERATURE);
            const GPIO_US_TRIGGER = 25;

            let startTime = 0;
            let endTime = 0;
            let elapsed = 0;
            let distance = 0;
            let StartFlag = false;

            let start = performance.now();
            elapsed = 0;
            EditorPreload.gpioSet(GPIO_US_TRIGGER, 1);
            this.pauseBrowser(0.01);
            EditorPreload.gpioSet(GPIO_US_TRIGGER, 0);

            while (EditorPreload.gpioGet(GPIO_US_ECHO, 0, 1) == 0) {
                startTime = performance.now();
            }

            while (EditorPreload.gpioGet(GPIO_US_ECHO, 0, 1) == 1) {
                endTime = performance.now();
            }

            elapsed = endTime - startTime;
            distance = elapsed * 34.3 / 2;

            console.log("distance" + distance);

            return distance <= 10;
        }

        async whenUVSensor(args) {

            EditorPreload.gpioSet(25, 0);
            // Set echo pin to input and set to pulled down
            EditorPreload.gpioPull(18, 1);

            EditorPreload.gpioSet(25, 1);

            this.wait(0.01);

            EditorPreload.gpioSet(25, 0);

            let pulseStart = 0;
            let pulseEnd = 0;
            let pulseDuration = 0;
            let distance = 0;

            while (EditorPreload.gpioGet(18, 0, 1) == 1) {
                pulseStart = Date.now();
            }
            while (EditorPreload.gpioGet(18, 0, 1) == 0) {
                pulseEnd = Date.now();
            }
            pulseDuration = pulseEnd - pulseStart;
            distance = pulseDuration;

            return distance;

            console.log(calculatedDistance);

            return calculatedDistance <= 10;
        }

        calculateDistance() {
            let pulseStart = 0;
            let pulseEnd = 0;
            let pulseDuration = 0;
            let distance = 0;

            while (EditorPreload.gpioGet(18, 0, 1) == 1) {
                pulseStart = Date.now();
            }
            while (EditorPreload.gpioGet(18, 0, 1) == 0) {
                pulseEnd = Date.now();

            }
            pulseDuration = pulseEnd - pulseStart;
            distance = pulseDuration;

            return distance;
        }

        wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms))
        }

        controlLEDs(args) {

            // EditorPreload.
            const ledStart = Cast.toNumber(args.START);
            const ledEnd = Cast.toNumber(args.END);
            const hexColor = Cast.toString(args.COLOR);

            const NUM_LEDS = 7;
            const GPIO = 18;
            const COLOR = this.rgb2Int(255, 0, 0);
            const DMA = 10;
            const FREQUENCY = 800000;
            const INVERT = false;
            const BRIGHTNESS = 125;
            const STRIP_TYPE = 'ws2812';

            var options = {
                dma: DMA,
                freq: FREQUENCY,
                gpio: GPIO,
                invert: INVERT,
                brightness: BRIGHTNESS,
                stripType: STRIP_TYPE
            };

            const ledStartIndex = ledStart - 1;
            const ledEndIndex = ledEnd - 1;

            let scriptCommand = "sudo";
            let scriptArgs = ["python3", "ScratchConnect.py"];

            let sudoScriptSynchronous = "0";
            let sudoScriptCall = "1";
            let sudoScriptCommand = "node";
            let sudoScriptName = "ws281x-control.js";
            let sudoScriptArguments = [7, 2, 5, "#00ff00", 10, 800000, 18, false, 125, "ws2812"];

            const state = EditorPreload.sudoScript(sudoScriptSynchronous, sudoScriptCall, sudoScriptCommand, sudoScriptName, sudoScriptArguments);
        }

        // Convert Hex to Decimal in JavaScript:
        // The `parseInt()` function takes a 'string' as an argument and returns an 'integer'.
        // `parseInt(string, radix);`
        // The first argument of it is the 'string' to be converted, and the second argument is the 'radix' (base) of the number.
        // `const hexToDecimal = hex => parseInt(hex, 16);`
        // (Source: https://sabe.io/blog/javascript-hex-to-decimal)
        hex2Decimal(hex) {
            return parseInt(hex, 16);
        }
        rgb2Int(r, g, b) {
            return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
        }

        getModule(args) {

            const CHANNEL_ID_1 = 0;
            const CHANNEL_ID_2 = 1;

            const options1 = {
                dma: 10,
                freq: 800000,
                gpio: 18,
                invert: false,
                brightness: 125,
                stripType: 'ws2812'
            };

            const {
                dma = 10,
                freq = 800000,
                gpio = 18,
                invert = false,
                brightness = 125,
                stripType = 'ws2812'
            } = options1;

            const numLeds = 5;
            const channelOptions = { count: numLeds, gpio, invert, brightness, stripType };

            const stripSettings = [{
                dma: 10,
                freq: 800000,
                channels: [
                    {
                        count: 5,
                        gpio: 18,
                        invert: false,
                        brightness: 125,
                        stripType: 'ws2812'
                    }
                ]
            }];

            const channel1 = channels[CHANNEL_ID_1];

            channel1.array[1] = 0xff0000;

        } // Set pin as output and set drive

        async display({ URL }) {
            closeFrame();
            if (await Scratch.canEmbed(URL)) {
                createFrame(Scratch.Cast.toString(URL));
            }
        }

        show() {
            if (iframe) {
                iframe.style.display = "";
            }
        }

        hide() {
            if (iframe) {
                iframe.style.display = "none";
            }
        }

        close() {
            closeFrame();
        }

        get({ MENU }) {
            MENU = Scratch.Cast.toString(MENU);
            if (MENU === "url") {
                if (iframe) return iframe.getAttribute("src");
                return "";
            } else if (MENU === "visible") {
                return !!iframe && iframe.style.display !== "none";
            } else if (MENU === "x") {
                return x;
            } else if (MENU === "y") {
                return y;
            } else if (MENU === "width") {
                return width >= 0 ? width : Scratch.vm.runtime.stageWidth;
            } else if (MENU === "height") {
                return height >= 0 ? height : Scratch.vm.runtime.stageHeight;
            } else if (MENU === "interactive") {
                return interactive;
            } else if (MENU === "resize behavior") {
                return resizeBehavior;
            } else {
                return "";
            }
        }

        setX({ X }) {
            x = Scratch.Cast.toNumber(X);
            updateFrameAttributes();
        }

        setY({ Y }) {
            y = Scratch.Cast.toNumber(Y);
            updateFrameAttributes();
        }

        setWidth({ WIDTH }) {
            width = Scratch.Cast.toNumber(WIDTH);
            updateFrameAttributes();
        }

        setHeight({ HEIGHT }) {
            height = Scratch.Cast.toNumber(HEIGHT);
            updateFrameAttributes();
        }

        setInteractive({ INTERACTIVE }) {
            interactive = Scratch.Cast.toBoolean(INTERACTIVE);
            updateFrameAttributes();
        }

        setResize({ RESIZE }) {
            if (RESIZE === "scale" || RESIZE === "viewport") {
                resizeBehavior = RESIZE;
                if (overlay) {
                    overlay.mode = getOverlayMode();
                    Scratch.renderer._updateOverlays();
                    updateFrameAttributes();
                }
            }
        }

        // 
        // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        // VIDEO START
        // 
        resetEverything() {

            for (const { videoElement } of Object.values(this.videos)) {
                videoElement.pause();
                videoElement.currentTime = 0;
            }

            for (const target of runtime.targets) {
                const drawable = renderer._allDrawables[target.drawableID];
                if (drawable.skin instanceof VideoSkin) {
                    target.setCostume(target.currentCostume);
                }
            }
        }

        async loadVideoURL(args, util) {
            // Always delete the old video with the same name, if it exists.
            this.deleteVideoURL(args);

            const videoName = Cast.toString(args.NAME);
            const videoFormat = Cast.toString(args.FORMAT);

            const url3 = "file:///opt/SIDEKICK/resources/videos/" + videoName + "." + videoFormat;

            const skinId = renderer._nextSkinId++;
            const skin = new VideoSkin(skinId, renderer, videoName, url3);
            renderer._allSkins[skinId] = skin;
            this.videos[videoName] = skin;

            return skin.readyPromise;
        }

        deleteVideoURL(args) {

            const videoName = Cast.toString(args.NAME);
            const videoSkin = this.videos[videoName];
            if (!videoSkin) return;

            for (const target of runtime.targets) {
                const drawable = renderer._allDrawables[target.drawableID];
                if (drawable && drawable.skin === videoSkin) {
                    target.setCostume(target.currentCostume);
                }
            }

            renderer.destroySkin(videoSkin.id);
            Reflect.deleteProperty(this.videos, videoName);
        }

        getLoadedVideos() {
            return JSON.stringify(Object.keys(this.videos));
        }

        showVideo(args, util) {
            const targetName = Cast.toString(args.TARGET);
            const videoName = Cast.toString(args.NAME);
            const target = this._getTargetFromMenu(targetName, util);
            const videoSkin = this.videos[videoName];
            if (!target || !videoSkin) return;

            vm.renderer.updateDrawableSkinId(target.drawableID, videoSkin._id);
        }

        showVideoAndPlay(args, util) {
            const targetName = Cast.toString(args.TARGET);
            const videoName = Cast.toString(args.NAME);
            const target = this._getTargetFromMenu(targetName, util);
            const videoSkin = this.videos[videoName];
            if (!target || !videoSkin) return;

            vm.renderer.updateDrawableSkinId(target.drawableID, videoSkin._id);

            const duration = 0;

            videoSkin.videoElement.play();
            videoSkin.videoElement.currentTime = duration;
            videoSkin.markVideoDirty();
        }

        stopShowingVideo(args, util) {
            const targetName = Cast.toString(args.TARGET);
            const target = this._getTargetFromMenu(targetName, util);
            if (!target) return;

            target.setCostume(target.currentCostume);
        }

        getCurrentVideo(args, util) {
            const targetName = Cast.toString(args.TARGET);
            const target = this._getTargetFromMenu(targetName, util);
            if (!target) return;

            const drawable = renderer._allDrawables[target.drawableID];
            const skin = drawable && drawable.skin;
            return skin instanceof VideoSkin ? skin.videoName : "";
        }

        startVideo(args) {
            const videoName = Cast.toString(args.NAME);
            const duration = Cast.toNumber(args.DURATION);
            const videoSkin = this.videos[videoName];
            if (!videoSkin) return;

            videoSkin.videoElement.play();
            videoSkin.videoElement.currentTime = duration;
            videoSkin.markVideoDirty();
        }

        getAttribute(args) {
            const videoName = Cast.toString(args.NAME);
            const videoSkin = this.videos[videoName];
            if (!videoSkin) return 0;

            switch (args.ATTRIBUTE) {
                case "current time":
                    return videoSkin.videoElement.currentTime;
                case "duration":
                    return videoSkin.videoElement.duration;
                case "volume":
                    return videoSkin.videoElement.volume * 100;
                case "width":
                    return videoSkin.size[0];
                case "height":
                    return videoSkin.size[1];
                default:
                    return 0;
            }
        }

        pause(args) {
            const videoName = Cast.toString(args.NAME);
            const videoSkin = this.videos[videoName];
            if (!videoSkin) return;

            videoSkin.videoElement.pause();
            videoSkin.markVideoDirty();
        }

        resume(args) {
            const videoName = Cast.toString(args.NAME);
            const videoSkin = this.videos[videoName];
            if (!videoSkin) return;

            videoSkin.videoElement.play();
            videoSkin.markVideoDirty();
        }

        getState(args) {
            const videoName = Cast.toString(args.NAME);
            const videoSkin = this.videos[videoName];
            if (!videoSkin) return args.STATE === "paused";

            return args.STATE == "playing"
                ? !videoSkin.videoElement.paused
                : videoSkin.videoElement.paused;
        }

        setVolume(args) {
            const videoName = Cast.toString(args.NAME);
            const value = Cast.toNumber(args.VALUE);
            const videoSkin = this.videos[videoName];
            if (!videoSkin) return;

            videoSkin.videoElement.volume = value / 100;
        }

        /** @returns {VM.Target|undefined} */
        _getTargetFromMenu(targetName, util) {
            if (targetName === "_myself_") return util.target;
            if (targetName === "_stage_") return runtime.getTargetForStage();
            return Scratch.vm.runtime.getSpriteTargetByName(targetName);
        }

        _getTargets() {
            let spriteNames = [
                { text: "myself", value: "_myself_" },
                { text: "Stage", value: "_stage_" },
            ];
            const targets = Scratch.vm.runtime.targets
                .filter((target) => target.isOriginal && !target.isStage)
                .map((target) => target.getName());
            spriteNames = spriteNames.concat(targets);
            return spriteNames;
        }
        // 
        // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        // VIDEO END
        // 

        waitForSeconds(args, util) {
            if (util.stackTimerNeedsInit()) {
                const duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));

                util.startStackTimer(duration);
                this.runtime.requestRedraw();
                util.yield();
            } else if (!util.stackTimerFinished()) {
                util.yield();
            }
        }

        // waitUntilTrue(args, util) {
        //     // if (util.stackTimerNeedsInit()) {
        //     //     const duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));

        //     //     util.startStackTimer(duration);
        //     //     this.runtime.requestRedraw();
        //     //     util.yield();
        //     // } else 
        //     // if (!util.stackTimerFinished()) {
        //     const condition = Cast.toBoolean(args.CONDITION);
        //     if (!condition) {
        //         util.yield();
        //     }
        // }
        // // waitUntil(args, util) {
        // //     const condition = Cast.toBoolean(args.CONDITION);
        // //     if (!condition) {
        // //         util.yield();
        // //     }
        // // }

        waitUntilTrueCondition(args, util) {
            // if (util.stackTimerNeedsInit()) {
            //     const duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));

            //     util.startStackTimer(duration);
            //     this.runtime.requestRedraw();
            //     util.yield();
            // } else 
            // if (!util.stackTimerFinished()) {
            const condition = Cast.toBoolean(args.CONDITION);
            if (!condition) {
                util.yield();
            }
        }

        startWhenTrue(args) {
            // const pin = Cast.toNumber(args.GPIO);
            // const val = Cast.toString(args.HILO);
            // // const state = gpio.get(pin, -1, -1); // Get state of pin, leave pin as input/output, leave pull state
            // const state = EditorPreload.gpioGet(pin, -1, -1); //11 Get state of pin, leave pin as input/output, leave pull state

            // let binary = 0;
            // if (val === 'high') binary = 1;
            // return state === binary;
            return Cast.toBoolean(args.CONDITION);
        } // Get pin state (leave pin as input/output)

        compareConditions(args, util) {
            // if (util.stackTimerNeedsInit()) {
            //     const duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));

            //     util.startStackTimer(duration);
            //     this.runtime.requestRedraw();
            //     util.yield();
            // } else 
            // if (!util.stackTimerFinished()) {

            // const condition = Cast.toNumber(args.CONDITION);
            // const value = Cast.toNumber(args.VALUE);


            // if (condition != value) {
            //     util.yield();
            // }


            // const condition = Cast.toBoolean(args.CONDITION);
            // const value = Cast.toNumber(args.VALUE);


            // if (condition != value) {
            //     util.yield();
            // }

            const format = function (string) {
                // return Cast.toString(string).toLowerCase();
                return Cast.toString(string);
            };
            return format(args.VALUE1) == format(args.VALUE2);
        }

        waitUntil(args, util) {
            const condition = Cast.toBoolean(args.CONDITION);
            if (!condition) {
                util.yield();
            }
        }

        getSensorState(args, util) {

            const sensorPinNumber = Cast.toNumber(args.SENSOR);

            // !!! TODO: UV-Sensor hier implementieren !!!
            // const sensorPinState = EditorPreload.uvGet(sensorPinNumber);
            const sensorPinState = 0;

            // if (buttonPinState == 1) {
            if (sensorPinState == 1) {
                // if (buttonWatchedState == '0') return true;
                return true;
                // else return false;
            } else {
                // if (buttonWatchedState == '1') return true;
                return false;
                // else return false;
            }

            // const format = function (string) {
            //     // return Cast.toString(string).toLowerCase();
            //     return Cast.toString(string);
            // };
            // return format(args.VALUE1) == format(args.VALUE1);
        }
    }

    Scratch.extensions.register(new GPIO());

})(Scratch);
