(function () {
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

    function cps(save, time, depth) {
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

        sorted.sort(function(a, b) {
            return heuristics[a.index] > heuristics[b.index] ? 1 : -1;
        });
        sorted.reverse();

        if (depth == 0 && window.debug) {
            console.log(sorted.map(function (b) {
                return b.buyable.name + ' ' + Beautify(cpsGains[b.index]) + ' ' + Beautify(cpsAccel[b.index]);
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
            return [{
                name: b.buyable.name,
                id: b.buyable.id,
                isUpgrade: !b.buyable.price,
                secondsTillPurchase: secondsTillPurchase[b.index],
                cps: Game.cookiesPs
            }].concat(cps(Game.WriteSave(1), time - secondsTillPurchase[b.index], depth + 1));
        });

        resultsCookies = results.map(function (r) {
            var cookiesMade = 0,
                timeLeft = time,
                cps = currCps;

            if (depth == 0 && window.debug) {
                console.log('[' + r.map(function (x) { return x.name; }).join(', ') + ']');
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
    }

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

            Game.ObjectsById[i].drawFunction = function () {};
            Game.ObjectsById[i].special = null;
            Game.ObjectsById[i].specialDrawFunction = null;
        }
        Game.Popup = function () {};
    }

    function unoptimizeLoadHack() {
        for (var i in Game.ObjectsById) {
            Game.ObjectsById[i].drawFunction = savedFns.drawFunction[i];
            Game.ObjectsById[i].special = savedFns.special[i];
            Game.ObjectsById[i].specialDrawFunction = savedFns.specialDrawFunction[i];
        }
        Game.Popup = savedFns.gamePopup;
    }
    
    var img = new Image();
    img.src = 'http://orteil.dashnet.org/cookieclicker/img/icons.png?v=1';

    var canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    canvas.style.width = '48px';
    canvas.style.height = '48px';
    var ctx = canvas.getContext('2d');

    window.tryBuy = function () {
        var save = Game.WriteSave(1),
            idealBuy,
            price,
            timeToWait,
            bestAction,
            iconUrl,
            firstWait = true;

        if (window.tryBuyTimeoutId) {
            clearTimeout(window.tryBuyTimeoutId);
        }

        optimizeLoadHack();
        bestAction = cps(save, -1, 0);
        unoptimizeLoadHack();

        idealBuy = bestAction.isUpgrade ?
            Game.UpgradesById[bestAction.id] :
            Game.ObjectsById[bestAction.id];

        Game.LoadSave(save);
        Game.CalculateGains();
        price = (idealBuy.price || idealBuy.basePrice);

        if (bestAction.isUpgrade) {
            ctx.drawImage(img, 48 * idealBuy.icon[0], 48 * idealBuy.icon[1], 48, 48, 0, 0, 48, 48);
            iconUrl = canvas.toDataURL();
        } else {
            iconUrl = 'http://orteil.dashnet.org/cookieclicker/img/' + idealBuy.icon + '.png';
        }

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
                notify('Buying ' + idealBuy.name, iconUrl);
                idealBuy.buy();
                setTimeout(function () { tryBuy() });
            } else if (firstWait == true) {
                timeToWait = (price - Game.cookies) / Game.cookiesPs;
                notify('Waiting till ' + new Date(new Date().getTime() + timeToWait * 1000).toLocaleString('en-US') + ' to buy ' + idealBuy.name + ' +' + Beautify(bestAction.cps - Game.cookiesPs) + '/s +' + Beautify((bestAction.cps - Game.cookiesPs) / timeToWait) + '/s^2', iconUrl);
                window.tryBuyTimeoutId = setTimeout(doBuy, 1000);
                firstWait = false;
            } else {
                window.tryBuyTimeoutId = setTimeout(doBuy, 1000);
            }
        }

        setTimeout(doBuy);
    }
}());
