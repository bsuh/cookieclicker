scheduleBuyTimeoutId = null
checkStrategyTimeoutId = null

Shopper = window.Shopper = window.Shopper or {}

if Shopper.stopAutobuyer
  Shopper.stopAutobuyer()

Shopper.scheduleBuy = (item, bank, callback) ->
  if Game.cookies >= ((item.price or item.basePrice) + bank)
    [item.clickFunction, savedFn] = [null, item.clickFunction]
    item.buy()
    item.clickFunction = savedFn
    callback()
  else
    scheduleBuyTimeoutId = setTimeout(
      (-> Shopper.scheduleBuy(item, bank, callback)),
      1000 * Math.min(1, Shopper.secondsTillPurchase(item))
    )

Shopper.startAutobuyer = (bank = 0) ->
  Shopper.stopAutobuyer()

  noBuffCps = Shopper.getCps() / (if Game.frenzy > 0 then Game.frenzyPower else 1)
  if bank == -1
    b = noBuffCps * 12000
  else if bank == -2
    b = noBuffCps * 12000 * 7
  else
    b = bank

  item = Shopper.strategy()
  Shopper.scheduleBuy(item, b, (-> Shopper.startAutobuyer(bank)))

  # recalculate choice in 10 seconds, in case of research unlocked upgrades
  checkStrategyTimeoutId = setTimeout((-> Shopper.startAutobuyer(bank)), 10000)

Shopper.stopAutobuyer = ->
  clearTimeout(scheduleBuyTimeoutId)
  clearTimeout(checkStrategyTimeoutId)
