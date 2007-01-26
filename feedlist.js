//var xmlhttp = Ajax.getTransport();

function viewCategory(cat) {
	active_feed_is_cat = true;
	viewfeed(cat, '', true);
}

function feedlist_callback() {
	if (xmlhttp.readyState == 4) {
		debug("feedlist_callback");
		var f = document.getElementById("feeds-frame");
		f.innerHTML = xmlhttp.responseText;
		feedlist_init();
	}
}

var page_offset = 0;

function viewFeedGoPage(i) {
	try {
		if (!getActiveFeedId()) return;

		if (i != 0) {
			page_offset = page_offset + i;
		} else {
			page_offset = 0;
		}

		if (page_offset < 0) page_offset = 0;
		viewfeed(getActiveFeedId(), undefined, undefined, undefined,
			undefined, page_offset);
	} catch (e) {
		exception_error(e, "viewFeedGoPage");
	}
}

function viewfeed(feed, subop, is_cat, subop_param, skip_history, offset) {
	try {

		//if (!offset) page_offset = 0;

		if (offset != undefined) {
			page_offset = offset;
		}

		enableHotkeys();

		if (!skip_history) {
			history_push('FEED:' + feed + ':' + subop + ':' + is_cat +
				':' + subop_param);
		}

		var toolbar_query = Form.serialize("main_toolbar_form");
		var toolbar_form = document.forms["main_toolbar_form"];

		if (document.forms["main_toolbar_form"].query) {
			toolbar_form.query.value = "";
		}

/*		storeInitParam("toolbar_limit", 
			toolbar_form.limit[toolbar_form.limit.selectedIndex].value);

		storeInitParam("toolbar_view_mode", 
			toolbar_form.view_mode[toolbar_form.view_mode.selectedIndex].value);  */

		var query = "backend.php?op=viewfeed&feed=" + feed + "&" +
			toolbar_query + "&subop=" + param_escape(subop);

		if (document.getElementById("search_form")) {
			var search_query = Form.serialize("search_form");
			query = query + "&" + search_query;
			closeInfoBox(true);
		}

		debug("IS_CAT_STORED: " + activeFeedIsCat() + ", IS_CAT: " + is_cat);

		var fe = document.getElementById("FEEDR-" + getActiveFeedId());

		if (fe) {
			fe.className = fe.className.replace("Selected", "");
		}

		setActiveFeedId(feed);
	
		if (is_cat != undefined) {
			active_feed_is_cat = is_cat;
		}

		if (subop == "MarkAllRead") {

			var feedlist = document.getElementById('feedList');
			
			var next_unread_feed = getRelativeFeedId(feedlist,
					getActiveFeedId(), "next", true);

			if (!next_unread_feed) {
				next_unread_feed = getRelativeFeedId(feedlist,
					-1, "next", true);
			}

			var show_next_feed = getInitParam("on_catchup_show_next_feed") == "1";

			if (next_unread_feed && show_next_feed && !activeFeedIsCat()) {
				query = query + "&nuf=" + param_escape(next_unread_feed);
				setActiveFeedId(next_unread_feed);
			}
		}

		if (activeFeedIsCat()) {
			query = query + "&cat=1";
		}

		if (page_offset != 0) {
			query = query + "&skip=" + page_offset;
		}

		if (navigator.userAgent.match("Opera")) {
			var date = new Date();
			var timestamp = Math.round(date.getTime() / 1000);
			query = query + "&ts=" + timestamp
		}

		if (!activeFeedIsCat()) {
			var feedr = document.getElementById("FEEDR-" + getActiveFeedId());
			if (feedr && !feedr.className.match("Selected")) {	
				feedr.className = feedr.className + "Selected";
			} 
		}
		
		disableContainerChildren("headlinesToolbar", false);
		Form.enable("main_toolbar_form");

		debug(query);

/*		var container = document.getElementById("headlines-frame");

		container.innerHTML = "<div class=\"loadingPrompt\"><img src=\"images/indicator_white.gif\">&nbsp;" +
			"Loading, please wait...</div>"; */

		notify("Loading, please wait...", true);

//		xmlhttp.abort();

		if (xmlhttp_ready(xmlhttp)) {
			xmlhttp.open("GET", query, true);
			xmlhttp.onreadystatechange=headlines_callback;
			xmlhttp.send(null);
		} else {
			debug("xmlhttp busy (@feeds)");
		}  

	} catch (e) {
		exception_error("viewfeed", e);
	}		
}

function toggleCollapseCat(cat) {
	try {
		if (!xmlhttp_ready(xmlhttp)) {
			printLockingError();
			return;
		}
	
		var cat_elem = document.getElementById("FCAT-" + cat);
		var cat_list = document.getElementById("FCATLIST-" + cat).parentNode;
		var caption = document.getElementById("FCAP-" + cat);
		
		if (cat_list.className.match("invisible")) {
			cat_list.className = "";
			caption.innerHTML = caption.innerHTML.replace("...", "");
			if (cat == 0) {
				setCookie("ttrss_vf_uclps", "0");
			}
		} else {
			cat_list.className = "invisible";
			caption.innerHTML = caption.innerHTML + "...";
			if (cat == 0) {
				setCookie("ttrss_vf_uclps", "1");
			}
		}

		new Ajax.Request("backend.php?op=feeds&subop=collapse&cid=" + 
			param_escape(cat));

	} catch (e) {
		exception_error("toggleCollapseCat", e);
	}
}

function feedlist_init() {
	try {
//		if (arguments.callee.done) return;
//		arguments.callee.done = true;		
		
		debug("in feedlist init");
		
		hideOrShowFeeds(document, getInitParam("hide_read_feeds") == 1);
		document.onkeydown = hotkey_handler;
		setTimeout("timeout()", 0);

		debug("about to remove splash, OMG!");

		var o = document.getElementById("overlay");

		if (o) {
			o.style.display = "none";
			debug("removed splash!");
		}

		if (typeof correctPNG != 'undefined') {
			correctPNG();
		}

		if (getActiveFeedId()) {
			debug("some feed is open on feedlist refresh, reloading");
			setTimeout("viewCurrentFeed()", 100);
		} 

	} catch (e) {
		exception_error("feedlist/init", e);
	}
}
