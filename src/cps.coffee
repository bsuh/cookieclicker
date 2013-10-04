Shopper = window.Shopper = window.Shopper or {}

Shopper.getCps = ->
  if Game.recalculateGains then Game.CalculateGains()
  Game.cookiesPs

Shopper.cpsGainUnsafe = (item) ->
  initialCps = Shopper.getCps()

  Game.Earn(item.price or item.basePrice)
  item.buy()

  Shopper.getCps() - initialCps

Shopper.cpsGain = (item) ->
  Shopper.safeCall -> Shopper.cpsGainUnsafe(item)

Shopper.cpsGainPerSecond = (item) ->
  Shopper.cpsGain(item) * Shopper.getCps() / (item.price or item.basePrice)
