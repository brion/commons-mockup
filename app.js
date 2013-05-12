// May 2013's featured photos
var uploads = [
    //"File:Clock Tower - Palace of Westminster, London - September 2006-2.jpg",
    //"File:F. Müllhaupt's Militarische & Verkehrs-Karte der Deutsch-Französischen Grenze...jpg",
    //"File:Étienne Carjat, Portrait of Charles Baudelaire, circa 1862.jpg",
    "File:Pair of Merops apiaster feeding.jpg",
    "File:Spb 06-2012 English Embankment 01.jpg",
    "File:QeshmIsland NASA.jpg",
    "File:Final Challenge international de Paris 2013-01-26 193155.jpg",
    "File:Honeymoon Bay Sunset 2.jpg",
    "File:Theobroma cacao flower 01.JPG",
    "File:Kaselaug - Rabivere maastikukaitseala.jpg",
    "File:Sint Anna ter Muiden Kerk R02.jpg",
    "File:Phoenicopterus roseus flight (Walvis bay).jpg",
    "File:Royal Albert Hall, London - Nov 2012.jpg",
    "File:Iguana V.jpg",
    "File:Brachythemis contaminata female (1), Burdwan, West Bengal, India 04 10 2012.JPG",
    "File:Schwedenfeuer Detail 04.JPG",
    "File:2011-08-01 10-31-42 Switzerland Segl-Maria.jpg",
    "File:Alatskivi mõisa peahoone.jpg",
    "File:Matanuska Glacier mouth.jpg",
    "File:Diceros bicornis (Etosha).jpg",
    "File:Supercell.svg",
    "File:Brightly lit STS-135 on launch pad 39a.jpg",
    "File:Djupfjorden, 2010 09.jpg",
    "File:Iguanidae head from Venezuela.jpg",
    "File:Rakvere linnuse varemed vallikraaviga1.jpg",
    "File:Tony Estanguet.jpg",
    "File:Nepali Bride.jpg",
    "File:28-090504-black-headed-bunting-at-first-layby.jpg",
    "File:Grot pavilion in Tsarskoe Selo.jpg",
    "File:Pachygrapsus marmoratus 2009 G4.jpg",
    "File:Perth CBD from Mill Point.jpg"
];

var remembered = 0;
function saveScrollPosition() {
	remembered = $('#body').scrollTop();
}
function restoreScrollPosition() {
	$('#body').scrollTop(remembered);
}

function lookupImageInfo(images, width, height) {
	return $.ajax({
		url: 'http://commons.wikimedia.org/w/api.php',
		data: {
			format: 'json',
			action: 'query',
			prop: 'imageinfo',
			iiprop: 'url|size|timestamp',
			iiurlwidth: width,
			iiurlheight: height,
			titles: images.join('|')
		},
		dataType: 'jsonp', // grrr
	});
}

lookupImageInfo(
	uploads,
	640,
	640
).done(function(data) {
	var info = {};
	$.each(data.query.pages, function(i, page) {
		var imageinfo = page.imageinfo[0];
		info[page.title] = imageinfo;
	});
	$.each(uploads, function(i, title) {
		addGalleryImage(title, info[title]);
	});
});

function addGalleryImage(title, imageinfo) {
	var width = imageinfo.thumbwidth,
		height = imageinfo.thumbheight,
		url = imageinfo.thumburl,
		name = title;
	var $div = $('<div>'),
		$img = $('<img>')
			.attr('src', url)
			.attr('width', '320')
			.appendTo($div)
			.click(function() {
				openImageDetail(title, imageinfo);
			})
		
	$('#gallery-view').append($div);
}

function openImageDetail(title, imageinfo) {
	$('#detail-image')
		.attr('src', imageinfo.thumburl);
	$('#detail-data,#detail-image')
		.unbind('click')
		.click(function() {
			// Return to gallery
			$('.navpage.active').removeClass('active');
			$('#gallery').addClass('active');
			restoreScrollPosition();
		});

	saveScrollPosition();
	$('.navpage.active').removeClass('active');
	$('#detail').addClass('active');

	$('#detail-title').text(stripTitle(title));
	
	$('#detail-desc').empty();
	lookupDescription(title).done(function(descHtml) {
		$('#detail-desc').html(descHtml);
	});
	
	$('#detail-catlist').empty();
	lookupCategories(title).done(function(data) {
		$.each(data.query.pages, function(i, page) {
			$.each(page.categories, function(i, category) {
				showCategory(category.title);
			});
			showCategory('Add category', true);
		});
	});
	
	$('#detail-date-date').text(formatDate(imageinfo.timestamp));
	
	$('#detail-used-count').text('... articles');
	lookupGlobalUsage(title).done(function(articles) {
		$('#detail-used-count').text(articles.length + ' articles');
	});
}

function formatDate(date) {
	return date.replace(/^(\d+)-(\d+)-(\d+)(.*)$/, '$1-$2-$3');
}

function stripTitle(title) {
	return title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '');
}

function lookupCategories(title) {
	return $.ajax({
		url: 'https://commons.wikimedia.org/w/api.php',
		data: {
			format: 'json',
			action: 'query',
			prop: 'categories',
			clshow: '!hidden',
			titles: title
		},
		dataType: 'jsonp'
	});
}

function showCategory(category, isAdd) {
	var className = (isAdd ? 'category-add' : 'category-item');
	var suffix = (isAdd ? '' : ' ×');
	var prefix = (isAdd ? '+ ' : '');
	var title = category.replace(/^Category:/, '');
	var $span = $('<span>')
		.addClass(className || 'category-item')
		.text(prefix + title + suffix)
		.appendTo('#detail-catlist');
	$('#detail-catlist').append(' '); // whitespace hack
}

function lookupDescription(title) {
	var deferred = $.Deferred();
	$.ajax({
		url: 'https://commons.wikimedia.org/w/api.php',
		data: {
			format: 'json',
			action: 'query',
			prop: 'revisions',
			rvprop: 'content',
			rvparse: 1,
			rvlimit: 1,
			rvgeneratexml: 1,
			titles: title
		},
		dataType: 'jsonp'
	}).done(function(data) {
		//console.log(data);

		var page, rev;
		$.each(data.query.pages, function(i, item) {
			page = item;
		});
		rev = page.revisions[0];
		
		var pageHtml = rev['*'],
			pageXml = rev['parsetree'];
		
		//console.log(pageHtml);
		//console.log(pageXml);
		
		var $page = $('<div>' + pageHtml + '</div>');
		var $desc = $page.find('.description.en');
		var descHtml = $desc.html();
		
		deferred.resolve(descHtml);
	}).error(function(err) {
		deferred.reject(err);
	});
	return deferred.promise();
}

function lookupGlobalUsage(title) {
	var deferred = $.Deferred();
	$.ajax({
		url: 'https://commons.wikimedia.org/w/api.php',
		data: {
			format: 'json',
			action: 'query',
			prop: 'globalusage',
			titles: title
		},
		dataType: 'jsonp'
	}).done(function(data) {
		var page;
		$.each(data.query.pages, function(i, item) {
			page = item;
		});
		deferred.resolve(page.globalusage);
	}).error(function(err) {
		deferred.reject(err);
	});
	return deferred.promise();
}
