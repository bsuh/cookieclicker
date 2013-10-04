timeoutId = null

Shopper = window.Shopper = window.Shopper or {}

Shopper.scheduleBuy = (item, callback) ->
  if Game.cookies >= (item.price or item.basePrice)
    item.buy()
    setTimeout(callback, 100)
  else
    timeoutId = setTimeout(
      (-> Shopper.scheduleBuy(item, callback)),
      1000 * Math.min(1, Shopper.secondsTillPurchase item)
    )

Shopper.startAutobuyer = ->
  item = Shopper.strategy()
  window.console.log("Will buy #{item.name} next")
  Shopper.scheduleBuy(item, Shopper.startAutobuyer)

Shopper.stopAutobuyer = ->
  clearTimeout(timeoutId)
