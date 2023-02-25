// ==UserScript==
// @name     Plex Extension
// @version  1
// @author TennisRunner
// @website https://github.com/TennisRunner/
// @grant    GM.xmlHttpRequest
// @start-at document-start
// @include https://app.plex.tv/*
// ==/UserScript==


(async() =>
{  
  function sleep(amount)
  {
    return new Promise((resolve) => setTimeout(resolve, amount));
  }
  
	let res = await fetch("https://code.jquery.com/jquery-3.6.0.js?v=1");

	eval(await res.text());

	let $ = jQuery.noConflict();

 
	function onElementCreation(selector, callback)
	{
		var elements = document.querySelectorAll(selector);

		for (var el of elements)
		{
			if (callback(el) === true)
				return;
		}

		var observer = new MutationObserver(function (mutations)
		{
			mutations.forEach(function (mutation)
			{
				var nodes = Array.from(mutation.addedNodes);
				for (var node of nodes)
				{
					if (node.matches && node.matches(selector))
					{
						if (callback(node) === true)
						{
							observer.disconnect();
							return;
						}
					}
				};
			});
		});

		observer.observe(document.documentElement, { childList: true, subtree: true });
	}

	function waitForElement(selector)
	{
		return new Promise(function (resolve, reject)
		{
			var element = document.querySelector(selector);

			if (element)
			{
				resolve(element);
				return;
			}

			var observer = new MutationObserver(function (mutations)
			{
				mutations.forEach(function (mutation)
				{
					var nodes = Array.from(mutation.addedNodes);
					for (var node of nodes)
					{
						if (node.matches && node.matches(selector))
						{
							observer.disconnect();
							resolve(node);
							return;
						}
					};
				});
			});

			observer.observe(document.documentElement, { childList: true, subtree: true });
		});
	}


	function getDirectUrl()
	{
		try
		{
			var src = $(`[src*=".plex.direct"]`).first().attr("src");

			var url = new URL(src);

			return  url.origin;
		}
		catch { }

		return null;
	}

	async function getInfo(key)
	{
		var origin = "http://127.0.0.1:32400";

		let directUrl = getDirectUrl();

		if(directUrl)
			origin = directUrl;

		if(key == null)
			key = new URLSearchParams(window.location.hash.split("?")[1]).get("key");

		var params = new URLSearchParams();

		params.set("X-Plex-Token", getPlexToken());

		let res = await fetch(`${origin}${key}?${params.toString()}`,
			{
				headers:
				{
					"Accept": "application/json"
				}
			});

		let data = await res.json();

		return data;
	}

	function getPlexToken()
	{
		return localStorage.getItem("myPlexAccessToken");
	}


	// when clicking on the 3 dots on a poster
	$(document).on("click", "button[aria-label=\"More Actions\"]", async function (e)
	{
		// If the clicked poster belongs to the seasons section
		if ($(this).parents(`[class*="PrePlayDescendantList-listContainer-"]`).find(`[data-testid="hubTitle"]:contains("Seasons")`).length == 0)
			return;

    
    let seasonIndex = $(this).parents(`[data-testid="cellItem"]`).index();
    
		let menu = await waitForElement(`[class*="Menu-menuPortal-"]`);

		let button = $(`
			<button>Download Season</button>
		`);

		button.on("click", async function (e)
		{
			let currentPageInfo = await getInfo();

			let showInfo = await getInfo(currentPageInfo.MediaContainer.Metadata[0].key);

			let currentSeasonInfo = await getInfo(showInfo.MediaContainer.Metadata[seasonIndex].key);

			let fileUrls = currentSeasonInfo.MediaContainer.Metadata.map(x => x.Media[0].Part[0].key);
			
			for(let url of fileUrls)
			{
				var link = $("<a></a>");	

				link.attr("href", getDirectUrl() + url + `?download=1&X-Plex-Token=${getPlexToken()}`);

				link[0].click();
          
        await sleep(2000);
			}

		});

		var targetButton = $(menu).find(`button:contains("Analyze"),button:contains("Reproduzir a seguir")`).first()
    
		targetButton[0].classList.forEach(x => button.addClass(x));

		targetButton.after(button);
	});
})();
    

    
