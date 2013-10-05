timeoutId = null

Shopper = window.Shopper = window.Shopper or {}

Shopper.scheduleBuy = (item, bank, callback) ->
  if Game.cookies >= ((item.price or item.basePrice) + bank)
    item.buy()
    setTimeout(callback, 100)
  else
    timeoutId = setTimeout(
      (-> Shopper.scheduleBuy(item, callback)),
      1000 * Math.min(1, Shopper.secondsTillPurchase(item))
    )

Shopper.startAutobuyer = (bank = 0) ->
  b = bank
  if bank == -1
    b = Shopper.getCps() * 12000
  else if bank == -2
    b = Shopper.getCps() * 12000 * 7

  item = Shopper.strategy()
  window.console.log("Will buy #{item.name} next")
  Shopper.scheduleBuy(item, b, (-> Shopper.startAutobuyer(bank)))

Shopper.stopAutobuyer = ->
  clearTimeout(timeoutId)
