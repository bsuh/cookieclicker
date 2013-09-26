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
    window.Shopper.strategy = function (save) {
        Game.LoadSave(save);
        Game.CalculateGains();

        var buyables = Game.UpgradesInStore.concat(Game.ObjectsById),
            currCookies = Game.cookies,
            currCps = Game.cookiesPs,
            secondsTillPurchase = buyables.map(function (buyable) {
                return Math.max((buyable.price || buyable.basePrice) - currCookies) / currCps;
            }),
            secondsToEarn = buyables.map(function (buyable) {
                return (buyable.price || buyable.basePrice) / currCps;
            }),
            cpsGains,
            heuristics,
            sorted;

        function simulateBuy(index) {
            Game.LoadSave(save);
            Game.Earn(secondsTillPurchase[index] * currCps);
            buyables[index].buy();
            Game.CalculateGains();
        }

        cpsGains = buyables.map(function (buyable, index) {
            simulateBuy(index);
            return Game.cookiesPs - currCps;
        });

        heuristics = buyables.map(function (buyable, index) {
            return cpsGains[index] / Math.max(secondsTillPurchase[index], 0.5);
        });

        sorted = buyables.map(function (b, i) {
            return { index: i, buyable: b }
        });

        sorted.sort(function (a, b) {
            return heuristics[a.index] > heuristics[b.index] ? 1 : -1;
        });
        sorted.reverse();

        return {
            id: sorted[0].buyable.id,
            isUpgrade: !sorted[0].buyable.price,
            cps: currCps + cpsGains[sorted[0].index]
        };
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
            timeToEarn,
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
                timeToEarn = price / Game.cookiesPs;
                notify('Waiting till ' + new Date(new Date().getTime() + timeToWait * 1000).toLocaleString('en-US') +
                    ' to buy ' + buyable.name +
                    ' +' + Beautify(action.cps - Game.cookiesPs) + '/s ' +
                    ' +' + Beautify((action.cps - Game.cookiesPs) / timeToEarn) + '/s^2', iconUrl);

                window.Shopper.shopTimeout = setTimeout(doBuy, 1000 * Math.min(1, timeToWait));
                firstWait = false;
            } else {
                window.Shopper.shopTimeout = setTimeout(doBuy, 1000 * Math.min(1, timeToWait));
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

            buyable = (action.isUpgrade ? Game.UpgradesById : Game.ObjectsById)[action.id];
            console.log(buyable.name);

            Game.LoadSave(save);
            Game.CalculateGains();
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
                    var time = Math.ceil((price - Game.cookies) / Game.cookiesPs);
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
