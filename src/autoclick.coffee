Shopper = window.Shopper = window.Shopper or {}

goldenCookieIntervalId = normalCookieIntervalId = null

Shopper.startAutoClicker = (clicksPerSecond = 5) ->
  Shopper.stopAutoClicker()
  normalCookieIntervalId = setInterval(Game.ClickCookie, 1000/clicksPerSecond)
  goldenCookieIntervalId = setInterval((-> if Game.goldenCookie.life > 0 then Game.goldenCookie.click()), 1000)

Shopper.stopAutoClicker = ->
  clearInterval(normalCookieIntervalId)
  clearInterval(goldenCookieIntervalId)
