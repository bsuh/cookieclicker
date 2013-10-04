describe('time functions', ->
  beforeEach(window.testingSetup)

  describe('secondsTillPurchase', ->
    it('should calculate the amount of time left till a purchase can occur', ->
      cursor = Game.ObjectsById[0]

      expect(Shopper.secondsTillPurchase(cursor)).toBe(Infinity)

      Game.cookiesPs = 1

      expect(Shopper.secondsTillPurchase(cursor)).toBe(15)
    )
  )

  describe('skipToAfterPurchase', ->
    it('should buy the item regardless of whether there\'s enough money', ->
      cursor = Game.ObjectsById[0]

      spyOn(cursor, 'buy').andCallThrough()
      spyOn(Game, 'Spend').andCallThrough()

      Game.cookies = cursor.price

      Shopper.skipToAfterPurchase(cursor)

      expect(cursor.buy).toHaveBeenCalled()
      expect(Game.Spend).toHaveBeenCalled()
      expect(Game.cookies).toBe(0)

      cursor.buy.reset()
      Game.Spend.reset()

      Shopper.skipToAfterPurchase(cursor)
      expect(cursor.buy).toHaveBeenCalled()
      expect(Game.Spend).toHaveBeenCalled()
      expect(Game.cookies).toBe(0)
    )
  )

  describe('secondsSavedByPurchase', ->
    it('should return the amount of seconds saved by purchasing an item first before purchasing target item', ->
      cursor = Game.ObjectsById[0]
      grandma = Game.ObjectsById[1]

      Shopper.skipToAfterPurchase(cursor)

      # now CPS is 0.1
      # Grandma costs 100 cookies
      # Cursor costs 17.25 cookies

      # 172.5 seconds to buy Cursor, then 500 seconds to buy Grandma = 672.5 seconds to buy Grandma
      # otherwise 1000 seconds to buy Grandma without buying Cursor first

      expect(Shopper.secondsSavedByPurchase(cursor, grandma)).toBe(1000-672.5)
    )

    it('should not mess with game state', ->
      initialState = Game.WriteSave(1)
      cursor = Game.ObjectsById[0]
      grandma = Game.ObjectsById[1]

      Shopper.secondsSavedByPurchase(cursor, grandma)
      expect(Game.WriteSave(1)).toBe(initialState)
    )
  )
)
