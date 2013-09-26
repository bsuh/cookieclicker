(function () {
    window.Shopper = {};

    /* Speed up testing by being able to change FPS to 1 */
    Game.changeFps = function (newFps) {
        function setNewFrameCount(obj, prop) {
            obj[prop] = Math.ceil(obj[prop] / Game.fps * newFps);
        }

        var i;

        setNewFrameCount(Game, 'autoclickerDetected');
        setNewFrameCount(Game, 'baseResearchTime');
        setNewFrameCount(Game, 'clickFrenzy');
        setNewFrameCount(Game, 'frenzy');
        setNewFrameCount(Game, 'pledgeT');
        setNewFrameCount(Game, 'researchT');
        setNewFrameCount(Game, 'T');
        setNewFrameCount(Game, 'TickerAge');
        setNewFrameCount(Game.goldenCookie, 'delay');
        setNewFrameCount(Game.goldenCookie, 'life');

        for (i in Game.cookieNumbers) {
            if (Game.cookieNumbers[i].life != -1) {
                setNewFrameCount(Game.cookieNumbers[i], 'life');
            }
        }
        for (i in Game.cookieParticles) {
            if (Game.cookieParticles[i].life != -1) {
                setNewFrameCount(Game.cookieParticles[i], 'life');
            }
        }
        for (i in Game.particles) {
            if (Game.particles[i].life != -1) {
                setNewFrameCount(Game.particles[i], 'life');
            }
        }

        Game.fps = newFps;
    };

    /* Utility functions to speed up loading & saving of games */
    var savedFns = {
        drawFunction: [],
        special: [],
        specialDrawFunction: [],
        gamePopup: Game.Popup
    };

    function optimizeLoadHack() {
        for (var i in Game.ObjectsById) {
            savedFns.drawFunction[i] = Game.ObjectsById[i].drawFunction;
            savedFns.special[i] = Game.ObjectsById[i].special;
            savedFns.specialDrawFunction[i] = Game.ObjectsById[i].specialDrawFunction;

            Game.ObjectsById[i].drawFunction = function () {
            };
            Game.ObjectsById[i].special = null;
            Game.ObjectsById[i].specialDrawFunction = null;
        }
        Game.Popup = function () {
        };
    }

    function unoptimizeLoadHack() {
        for (var i in Game.ObjectsById) {
            Game.ObjectsById[i].drawFunction = savedFns.drawFunction[i];
            Game.ObjectsById[i].special = savedFns.special[i];
            Game.ObjectsById[i].specialDrawFunction = savedFns.specialDrawFunction[i];
        }
        Game.Popup = savedFns.gamePopup;
    }

    /* the actual strategy to choose what to buy next */
    window.Shopper.strategy = function (save, time, depth) {
        if (time === undefined) {
            time = -1;
        }
        if (depth === undefined) {
            depth = 0;
        }

        Game.LoadSave(save);
        Game.CalculateGains();

        var buyables = Game.UpgradesInStore.concat(Game.ObjectsById),
            currCookies = Game.cookies,
            currCps = Game.cookiesPs,
            secondsTillPurchase = buyables.map(function (buyable) {
                return Math.max(Math.max((buyable.price || buyable.basePrice) - currCookies, 0) / currCps, 0.5);
            }),
            cpsGains,
            heuristics,
            sorted,
            times,
            top3,
            results,
            resultsCookies,
            resultsIndex;

        function simulateBuy(index) {
            Game.LoadSave(save);
            Game.Earn(secondsTillPurchase[index] * currCps);
            buyables[index].buy();
            Game.CalculateGains();
        }

        if (time == 0 || depth == 8) {
            return [];
        }

        cpsGains = buyables.map(function (buyable, index) {
            simulateBuy(index);
            return Game.cookiesPs - currCps;
        });

        heuristics = buyables.map(function (buyable, index) {
            return cpsGains[index] / secondsTillPurchase[index];
        });

        sorted = buyables.map(function (b, i) {
            return { index: i, buyable: b }
        });

        sorted.sort(function (a, b) {
            return heuristics[a.index] > heuristics[b.index] ? 1 : -1;
        });
        sorted.reverse();

        if (depth == 0 && window.debug) {
            console.log(sorted.map(function (b) {
                return b.buyable.name + ' ' + Beautify(cpsGains[b.index]) + ' ' + Beautify(heuristics[b.index]);
            }));
        }

        if (time < 0) {
            times = [];
            times.push(secondsTillPurchase[sorted[0].index]);
            if (currCps > 10) {
                times.push(secondsTillPurchase[sorted[1].index]);
                times.push(secondsTillPurchase[sorted[2].index]);
            }
            time = Math.min(
                Math.min.apply(Math, times) * 10,
                Math.max.apply(Math, times) * 1.5);
        }

        top3 = [];
        sorted.forEach(function (b) {
            if (top3.length == (depth < 2 ? 3 : 1)) {
                return;
            }

            if (secondsTillPurchase[b.index] <= time) {
                top3.push(b);
            }
        });

        results = top3.map(function (b) {
            simulateBuy(b.index);
            return [
                {
                    name: b.buyable.name,
                    id: b.buyable.id,
                    isUpgrade: !b.buyable.price,
                    secondsTillPurchase: secondsTillPurchase[b.index],
                    cps: Game.cookiesPs
                }
            ].concat(window.Shopper.strategy(Game.WriteSave(1), time - secondsTillPurchase[b.index], depth + 1));
        });

        resultsCookies = results.map(function (r) {
            var cookiesMade = 0,
                timeLeft = time,
                cps = currCps;

            if (depth == 0 && window.debug) {
                console.log('[' + r.map(function (x) {
                    return x.name;
                }).join(', ') + ']');
            }

            r.forEach(function (buy) {
                cookiesMade += cps * buy.secondsTillPurchase;
                timeLeft -= buy.secondsTillPurchase;
                cps = buy.cps;
                if (depth == 0 && window.debug) {
                    console.log('t: ' + Beautify(time - timeLeft) + ', cookies:' + Beautify(cookiesMade));
                }
            });

            return cookiesMade + timeLeft * cps;
        });

        resultsIndex = resultsCookies.indexOf(Math.max.apply(Math, resultsCookies));

        if (resultsIndex == -1) {
            return [];
        } else if (depth == 0) {
            return results[resultsIndex][0];
        } else {
            return results[resultsIndex];
        }
    };

    (function () {
        /* Canvas needed to crop icons image to specific upgrade icons */
        var img = new Image();
        img.src = 'http://orteil.dashnet.org/cookieclicker/img/icons.png?v=1';

        var canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        canvas.style.width = '48px';
        canvas.style.height = '48px';
        var ctx = canvas.getContext('2d');

        window.Shopper.getIconUrl = function (buyable) {
            if (!!buyable.price) {
                return 'http://orteil.dashnet.org/cookieclicker/img/' + buyable.icon + '.png';
            } else {
                ctx.drawImage(img, 48 * buyable.icon[0], 48 * buyable.icon[1], 48, 48, 0, 0, 48, 48);
                return canvas.toDataURL();
            }
        };
    }());

    if (window.Notification) {
        var permissionButton = document.createElement('button'),
            buttonContent = document.createTextNode('Enable desktop notifications');

        permissionButton.appendChild(buttonContent);
        document.getElementById('topBar').children[0].appendChild(permissionButton);
        document.getElementById('topBar').children[0].removeChild(
            document.getElementById('links'));

        permissionButton.addEventListener('click', function () {
            window.Notification.requestPermission();
        });
    }

    window.Shopper.shopTimeout = null;

    window.Shopper.start = function () {
        var save = Game.WriteSave(1),
            buyable,
            price,
            timeToWait,
            action,
            iconUrl,
            firstWait = true;

        clearTimeout(window.Shopper.shopTimeout);

        optimizeLoadHack();
        action = window.Shopper.strategy(save);
        unoptimizeLoadHack();

        buyable = (action.isUpgrade ? Game.UpgradesById : Game.ObjectsById)[action.id];

        Game.LoadSave(save);
        Game.CalculateGains();
        price = (buyable.price || buyable.basePrice);

        iconUrl = window.Shopper.getIconUrl(buyable);

        function notify(msg, iconUrl) {
            console.log(msg);
            if (window.Notification) {
                var notif = new Notification(msg, { icon: iconUrl });
                setTimeout(function () {
                    notif.close();
                }, 5000);
            }
        }

        function doBuy() {
            if (Game.cookies >= price) {
                notify('Buying ' + buyable.name, iconUrl);
                buyable.buy();
                setTimeout(window.Shopper.start);
            } else if (firstWait == true) {
                timeToWait = (price - Game.cookies) / Game.cookiesPs;
                notify('Waiting till ' + new Date(new Date().getTime() + timeToWait * 1000).toLocaleString('en-US') +
                    ' to buy ' + buyable.name +
                    ' +' + Beautify(action.cps - Game.cookiesPs) + '/s ' +
                    ' +' + Beautify((action.cps - Game.cookiesPs) / timeToWait) + '/s^2', iconUrl);

                window.Shopper.shopTimeout = setTimeout(doBuy, 1000);
                firstWait = false;
            } else {
                window.Shopper.shopTimeout = setTimeout(doBuy, 1000);
            }
        }

        setTimeout(doBuy);
    };

    window.Shopper.stop = function () {
        window.clearTimeout(window.Shopper.shopTimeout);
    };

    window.Shopper.test = function (strategyFn) {
        var initialSave,
            save,
            action,
            buyable,
            price,
            timeSpent = 0;

        // push old state & optimize
        initialSave = Game.WriteSave(1);
        optimizeLoadHack();

        // main loop
        while (timeSpent < 3600) {
            console.log('Time spent: ' + Beautify(timeSpent));

            save = Game.WriteSave(1);
            action = strategyFn(save);
            console.log(action);

            buyable = (action.isUpgrade ? Game.UpgradesById : Game.ObjectsById)[action.id];

            Game.LoadSave(save);
            price = (buyable.price || buyable.basePrice);

            if (Game.cookies < price) {
                while (Game.researchT > 0 || Game.pledgeT > 0) { // the only relevant variables in testing
                    Game.Logic();
                    timeSpent += 1 / Game.fps;
                    if (Game.cookies >= price) {
                        break;
                    }
                }
                if (Game.cookies < price) {
                    var time = Math.Ceil((Game.cookies - price) / Game.cookiesPs);
                    Game.Spend(Game.cookiesPs / Game.fps);
                    Game.Earn(time * Game.cookiesPs);
                    timeSpent += time;
                }
            }
            buyable.buy();
        }

        Game.CalculateGains();
        console.log('Final CPS @ ' + Beautify(timeSpent) + ': ' + Game.cookiesPs);

        // pop old state & deoptimize
        unoptimizeLoadHack();
        Game.LoadSave(initialSave);
        Game.Logic();
        Game.WriteSave();
    };
}());
