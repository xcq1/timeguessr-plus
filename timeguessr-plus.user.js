// ==UserScript==
// @name         TimeGuessr+
// @version      2024-06-10
// @description  Improved TimeGuessr with Sharable Timing and Daily Breakdowns
// @downloadURL  https://github.com/xcq1/timeguessr-plus/raw/main/timeguessr-plus.user.js
// @author       xcq1
// @match        https://timeguessr.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=timeguessr.com
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle ( `
    #plusButton {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: fit-content;
        padding: 0 0.5em;
        font-size: 1.4em;
        background: rgba(255,255,255,0.66);
        border: 1px solid var(--accent);
        border-radius: 1em;
        text-align: center;
    }
    #plusButton.results {
        top: 0;
    }
    #plusButton p {
        display: inline;
    }
    #plusButton a:hover, #plusPopup a:hover {
        text-decoration: underline;
        cursor: pointer;
    }
    #plusPopup {
        position: absolute;
        width: 80vw;
        height: 90vh;
        background: var(--body);
        opacity: 0;
        transition: opacity 0.25s, background-image 0.5s;
        border: 1px solid var(--accent);
        text-align: center;
        padding: 0.5em;
        display: flex;
        flex-direction: column;
    }
    #plusPopup img {
        flex: 1;
        overflow: hidden;
        object-fit: contain;
    }
    #plusPopupClose {
        display: inline;
        position: absolute;
        right: 1em;
    }
` );

    window.addEventListener('load',() => {
        const plusButton = document.createElement("div");
        plusButton.id = "plusButton";
        plusButton.textContent = "+";

        const navbar = document.querySelector(".navbar");
        if (navbar) {
            document.body.insertBefore(plusButton, navbar);
        } else {
            const resultsWrap = document.querySelector(".results-wrap");
            if (resultsWrap) {
                document.body.insertBefore(plusButton, resultsWrap)
            } else {
                const resultsContainer = document.querySelector("#resultsContainer");
                if (resultsContainer) {
                    document.body.insertBefore(plusButton, resultsContainer)
                } else {
                    document.body.insertBefore(plusButton, document.body.firstChild);
                }
            }
        }

        const formatSeconds = (seconds) => {
            const minutes = Math.floor(seconds / 60);
            return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
        };

        const path = window.location.pathname;
        const isDaily = path.includes("daily");
        let recordTime = null;
        let showTime = null;
        plusButton.className = "";

        const numbers = ["one", "two", "three", "four", "five"];
        const getTimeItem = (i) => `plus.${isDaily ? "daily" : ""}${i}.time`;
        const getYearScoreItem = (i) => `${numbers[i]}Geo`;
        const getGeoScoreItem = (i) => `${numbers[i]}Time`;
        const store = isDaily ? localStorage : sessionStorage;

        if (path.includes("one")) {
            recordTime = 1;
            for (let i = 1; i <= 5; i++) {
                store.removeItem(getTimeItem(i));
            }
        } else if (path.includes("two")) {
            recordTime = 2;
        } else if (path.includes("three")) {
            recordTime = 3;
        } else if (path.includes("four")) {
            recordTime = 4;
        } else if (path.includes("five")) {
            recordTime = 5;
        } else if (path.includes("results")) {
            for (let i = 5; i >= 1; i--) {
                if (store.getItem(getTimeItem(i))) {
                    showTime = i;
                    break;
                }
            }
        } else if (path.includes("final")) {
            plusButton.className = "results";
            plusButton.textContent = "+ ";
            for (let i = 1; i <= 5; i++) {
                const ithP = document.createElement("p");
                const ithTime = store.getItem(getTimeItem(i));
                if (isDaily) {
                    ithP.innerHTML = `| <a id='plus${i}'>#${i}</a>:&nbsp;${formatSeconds(ithTime)} `;
                } else {
                    ithP.innerHTML = `| #${i}:&nbsp;${formatSeconds(ithTime)} `;
                }
                plusButton.appendChild(ithP);
            }

            if (isDaily) {
                const breakdownPopup = document.createElement("div");
                breakdownPopup.id = "plusPopup";
                document.body.appendChild(breakdownPopup);

                for (let i = 1; i <= 5; i++) {
                    const plusI = document.querySelector(`#plus${i}`);
                    plusI.onclick = () => {
                        plusI.style.fontWeight = "bold";

                        const dailyItem = JSON.parse(store.getItem("dailyArray"))[i - 1];
                        breakdownPopup.innerHTML = `<h2>#${i}: ${dailyItem.Country}, ${dailyItem.Year}<a id="plusPopupClose">X</a></h2>`
                            + `<p> ${dailyItem.Description} (${dailyItem.License})</p>`
                            + `<img src="${dailyItem.URL}"/>`;

                        breakdownPopup.style.opacity = "1";
                        document.querySelector("#plusPopupClose").onclick = () => {
                                breakdownPopup.style.opacity = "0";
                        };

                        setTimeout(() => {
                            plusI.style.fontWeight = "normal";
                        }, 100);
                    };
                }
            }

            const shareButton = document.createElement("p");
            shareButton.innerHTML = "| <a id='plusshare'>Share</a>";
            plusButton.appendChild(shareButton);

            document.querySelector("#plusshare").onclick = () => {
                shareButton.style.fontWeight = "bold";
                let shareText = "TimeGuessr+ ";

                const dailyNo = store.getItem("dailyNumber");
                let iRows = [];
                let score = 0;
                for (let i = 0; i < 5; i++) {
                    const iGeo = Number(store.getItem(getGeoScoreItem(i)));
                    const iYear = Number(store.getItem(getYearScoreItem(i)));
                    const iTime = store.getItem(getTimeItem(i + 1));
                    score += iGeo + iYear;
                    iRows.push(`🌎 ${iGeo.toLocaleString("en-US")} 📅 ${iYear.toLocaleString("en-US")} 🕒 ${formatSeconds(iTime)}\n`);
                }
                if (isDaily) {
                    shareText += `Daily #${dailyNo}`;
                } else {
                    shareText += "Custom Game";
                }
                shareText += ` ${score.toLocaleString("en-US")}/50,000\n`;
                shareText += iRows.join("");
                if (isDaily) {
                    shareText += "https://timeguessr.com";
                } else {
                    shareText += store.getItem("shareLink");
                }

                navigator.clipboard.writeText(shareText);
                setTimeout(() => {
                    shareButton.style.fontWeight = "normal";
                }, 100);
            };
        }

        if (recordTime != null) {
            plusButton.textContent = "+ 0:00";
            const startTime = Date.now();
            window.setInterval(() => {
                const seconds = Math.floor((Date.now() - startTime) / 1000);
                plusButton.textContent = `+ ${formatSeconds(seconds)}`;
                store.setItem(getTimeItem(recordTime), seconds);
            }, 1000);
        } else if (showTime != null) {
            const seconds = store.getItem(getTimeItem(showTime));
            plusButton.textContent = `+ ${formatSeconds(seconds)}`;
        }

    }, false);

})();