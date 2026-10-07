package main

import (
	menu "aromi/src"
	"time"

	"net/http"

	"github.com/gin-gonic/gin"
)

var days []menu.DayMenu

func schedule() {
	loc, err := time.LoadLocation("Europe/Helsinki")
	if err != nil {
		panic(err)
	}

	run := func() {
		m, err := menu.FetchMenu()
		if err != nil {
			panic(err)
		}

		days = m
	}

	run()

	for {
		now := time.Now().In(loc)

		daysUntilMonday := (int(time.Monday) - int(now.Weekday()) + 7) % 7
		next := time.Date(
			now.Year(), now.Month(), now.Day()+daysUntilMonday,
			2, 0, 0, 0, loc,
		)

		if !next.After(now) {
			next = next.AddDate(0, 0, 7)
		}

		time.Sleep(time.Until(next))
		run()
	}
}

func main() {
	go schedule()

	r := gin.Default()
	r.LoadHTMLFiles(
      "templates/index.html", 
      "templates/today.txt"
    )
	r.Static("/static", "./static")
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"Days": days,
		})
	})
    r.GET("/today", func(c *gin.Context) {
		loc, err := time.LoadLocation("Europe/Helsinki")
		if err != nil {
			c.String(http.StatusInternalServerError, "failed to load timezone")
			return
		}

		today := time.Now().In(loc).Format("2006-01-02")

		c.Header("Content-Type", "text/plain; charset=utf-8")

		c.HTML(http.StatusOK, "today.txt", gin.H{
			"Days":  days,
			"Today": today,
		})
	})
	r.Run()
}
