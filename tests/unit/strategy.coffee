describe('strategy functions', ->
  beforeEach(window.testingSetup)

  describe('strategy', ->
    it('should buy 2 cursors first', ->
      cursor = Game.ObjectsById[0]

      expect(Shopper.strategy()).toBe(cursor)
      Shopper.skipToAfterPurchase(cursor)
      expect(Shopper.strategy()).toBe(cursor)
    )
  )
)
