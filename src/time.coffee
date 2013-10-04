Shopper = window.Shopper = window.Shopper or {};

Shopper.secondsTillPurchase = (item) ->
  ((item.price or item.basePrice) - Game.cookies) / Shopper.getCps()

Shopper.skipToAfterPurchase = (item) ->
  Game.Earn((item.price or item.basePrice) - Game.cookies)
  item.buy()

Shopper.secondsSavedByPurchase = (item, targetItem) ->
  Shopper.safeCall ->
    secondsTillItem = Shopper.secondsTillPurchase(item)
    oldSecondsTillTarget = Shopper.secondsTillPurchase(targetItem)

    Shopper.skipToAfterPurchase(item);

    newSecondsTillTarget = Shopper.secondsTillPurchase(targetItem)

    oldSecondsTillTarget - (newSecondsTillTarget + secondsTillItem)
