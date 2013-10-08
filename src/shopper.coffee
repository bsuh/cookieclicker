timeoutId = null

Shopper = window.Shopper = window.Shopper or {}

if Shopper.stopAutobuyer
  Shopper.stopAutobuyer()

Shopper.scheduleBuy = (item, bank, callback) ->
  if Game.cookies >= ((item.price or item.basePrice) + bank)
    item.buy()
    callback()
  else
    timeoutId = setTimeout(
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
  window.console.log("Will buy #{item.name} next. Bank: #{Beautify(b)}")
  Shopper.scheduleBuy(item, b, (-> Shopper.startAutobuyer(bank)))

Shopper.stopAutobuyer = ->
  clearTimeout(timeoutId)
