Shopper = window.Shopper = window.Shopper or {};

Shopper.strategy = ->
  Shopper.optimizeLoad();

  if Game.storeToRebuild
    Game.RebuildStore()

  items = Game.UpgradesInStore.concat(Game.ObjectsById)
  cpsGainsPs = items.map(Shopper.cpsGainPerSecond)
  zipped = zip(items, cpsGainsPs)
  sortedItems = [].concat(zipped).sort((a, b) ->
    if a[1] == b[1]
      return -(a[0].price || a[0].basePrice) + (b[0].price || b[0].basePrice)
    else if (a[1] > b[1])
      timeSaved = (Shopper.secondsSavedByPurchase(b[0], a[0]))
      if timeSaved == 0
        return a[1]-b[1]
      return -timeSaved
    else
      timeSaved = Shopper.secondsSavedByPurchase(a[0], b[0])
      if timeSaved == 0
        return a[1]-b[1]
      return timeSaved
  ).map((x) -> x[0])

  Shopper.unoptimizeLoad();

  return sortedItems[items.length - 1]

zip = (args...) ->
  shortest = if args.length == 0 then [] else args.reduce((a,b) ->
    if a.length < b.length then a else b
  )

  shortest.map((_, i) ->
    args.map (array) -> array[i]
  )
