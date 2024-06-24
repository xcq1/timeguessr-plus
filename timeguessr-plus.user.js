// ==UserScript==
// @name         TimeGuessr+
// @version      2024-06-24
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
        z-index: 11;
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
        z-index: 11;
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

        const randomNumber = (max) => Math.floor(Math.random() * (max + 1));
        const fuzzyEmojis = [
            { emoji: "👎", min: 0, max: 1250, rangeFuzz: 250 },
            { emoji: "😥", min: 0, max: 1500, rangeFuzz: 250 },
            { emoji: "🆘", min: 0, max: 1000, rangeFuzz: 250 },
            { emoji: "💩", min: 0, max: 1000, rangeFuzz: 250 },
            { emoji: "☠️", min: 0, max: 1000, rangeFuzz: 250 },
            { emoji: "📉", min: 500, max: 2000, rangeFuzz: 250 },
            { emoji: "🙁", min: 750, max: 1750, rangeFuzz: 500 },
            { emoji: "😤", min: 500, max: 1500, rangeFuzz: 500 },
            { emoji: "🩹", min: 1000, max: 2000, rangeFuzz: 500 },
            { emoji: "🤦", min: 1000, max: 2000, rangeFuzz: 350 },
            { emoji: "😐", min: 2000, max: 3000, rangeFuzz: 350 },
            { emoji: "📊", min: 2000, max: 3500, rangeFuzz: 250 },
            { emoji: "🥉", min: 2500, max: 3500, rangeFuzz: 500 },
            { emoji: "🆗", min: 2000, max: 3000, rangeFuzz: 250 },
            { emoji: "🤷", min: 2000, max: 3000, rangeFuzz: 350 },
            { emoji: "📈", min: 3000, max: 4000, rangeFuzz: 250 },
            { emoji: "🙂", min: 3000, max: 4000, rangeFuzz: 500 },
            { emoji: "🥈", min: 3500, max: 4500, rangeFuzz: 500 },
            { emoji: "💡", min: 3500, max: 4500, rangeFuzz: 500 },
            { emoji: "☄️", min: 4000, max: 4750, rangeFuzz: 250 },
            { emoji: "🏆", min: 4500, max: 5000, rangeFuzz: 250 },
            { emoji: "✨", min: 4500, max: 5000, rangeFuzz: 350 },
            { emoji: "💎", min: 4500, max: 5000, rangeFuzz: 500 },
            { emoji: "🏅", min: 4500, max: 5000, rangeFuzz: 500 },
            { emoji: "💯", min: 4950, max: 5000, rangeFuzz: 50 }
        ];
        const fuzzyTimeEmojis = [
            { emoji: "🚀", min: 0, max: 15, rangeFuzz: 5 },
            { emoji: "💨", min: 0, max: 20, rangeFuzz: 10 },
            { emoji: "🏎️", min: 0, max: 25, rangeFuzz: 15 },
            { emoji: "🚄", min: 0, max: 30, rangeFuzz: 20 },
            { emoji: "🚗", min: 30, max: 60, rangeFuzz: 15 },
            { emoji: "🚴", min: 45, max: 2 * 60, rangeFuzz: 20 },
            { emoji: "🐆", min: 60, max: 2 * 60, rangeFuzz: 30 },
            { emoji: "🏃", min: 75, max: 2.5 * 60, rangeFuzz: 45 },
            { emoji: "🐰", min: 80, max: 3 * 60, rangeFuzz: 50 },
            { emoji: "😐", min: 4 * 60, max: 7 * 60, rangeFuzz: 2 * 60 },
            { emoji: "🤷🏻", min: 5 * 60, max: 8 * 60 , rangeFuzz: 2.5 * 60 },
            { emoji: "🚶", min: 6 * 60, max: 8 * 60, rangeFuzz: 2 * 60 },
            { emoji: "🦥", min: 10 * 60, max: 20 * 60, rangeFuzz: 2 * 60 },
            { emoji: "🐢", min: 11 * 60, max: 18 * 60, rangeFuzz: 3 * 60 },
            { emoji: "️👨🏻‍🦯", min: 12 * 60, max: 25 * 60, rangeFuzz: 4 * 60 },
            { emoji: "🥱", min: 20 * 60 , max: 30 * 60 , rangeFuzz: 5 * 60 },
            { emoji: "⏳", min: 25 * 60, max: 35 * 60, rangeFuzz: 6 * 60 },
            { emoji: "🐌", min: 30 * 60, max: 60 * 60, rangeFuzz: 10 * 60 },
            { emoji: "😴", min: 40 * 60, max: 86400, rangeFuzz: 10 * 60 },
            { emoji: "💤", min: 50 * 60, max: 86400, rangeFuzz: 15 * 60 }
        ];
        const fuzzify = (value) => {
            const selected = fuzzyEmojis.filter((e) => {
                const lowFuzz = 2 * randomNumber(e.rangeFuzz) - e.rangeFuzz;
                const highFuzz = 2 * randomNumber(e.rangeFuzz) - e.rangeFuzz;
                return (e.min + lowFuzz) <= value && (e.max + highFuzz) > value;
            });
            return selected.length > 0 ? selected[randomNumber(selected.length - 1)].emoji : "?";
        };
        const fuzzySeconds = (seconds) => {
            const selected = fuzzyTimeEmojis.filter((e) => {
                const lowFuzz = 2 * randomNumber(e.rangeFuzz) - e.rangeFuzz;
                const highFuzz = 2 * randomNumber(e.rangeFuzz) - e.rangeFuzz;
                return (e.min + lowFuzz) <= seconds && (e.max + highFuzz) > seconds;
            });
            return selected.length > 0 ? selected[randomNumber(selected.length - 1)].emoji : "?";
        };

        const path = window.location.pathname;
        const isDaily = path.includes("daily");
        let recordTime = null;
        let showTime = null;
        plusButton.className = "";

        const numbers = ["one", "two", "three", "four", "five"];
        const getTimeItem = (i) => `plus.${isDaily ? "daily" : ""}${i}.time`;
        const getYearScoreItem = (i) => `${numbers[i]}Time`;
        const getGeoScoreItem = (i) => `${numbers[i]}Geo`;
        const store = isDaily ? localStorage : sessionStorage;

        if (path.includes("one")) {
            recordTime = 1;
            for (let i = 1; i <= 5; i++) {
                if (!store.getItem(getYearScoreItem(i)))
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
                if (store.getItem(getYearScoreItem(i))) {
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

            document.querySelector("#plusshare").onclick = (e) => {
                const fuzzy = e.ctrlKey;
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
                    if (!fuzzy) {
                        iRows.push(`🌎 ${iGeo.toLocaleString("en-US")} 📅 ${iYear.toLocaleString("en-US")} 🕒 ${formatSeconds(iTime)}`);
                    } else {
                        iRows.push(`🌎 ${fuzzify(iGeo)} 📅 ${fuzzify(iYear)} 🕒 ${fuzzySeconds(iTime)}`);
                    }
                }
                if (isDaily) {
                    shareText += `Daily #${dailyNo}`;
                } else {
                    shareText += "Custom Game";
                }

                if (fuzzy) {
                    const lowerBound = Math.max(0, score - randomNumber(5000));
                    const upperBound  = Math.min(lowerBound + 5000, 50000);
                    shareText += ` ${lowerBound.toLocaleString("en-US")}–${upperBound.toLocaleString("en-US")}/50,000\n`;
                } else {
                    shareText += ` ${score.toLocaleString("en-US")}/50,000\n`;
                }

                shareText += iRows.join("\n") + "\n";
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