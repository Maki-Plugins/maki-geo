=== Maki Geo ===
Contributors: makiplugins
Tags: geo, location, geo target, location targeting, ip
Requires at least: 6.7
Tested up to: 6.7
Stable tag: 1.0.0
Requires PHP: 7.3
License: GPLv2
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Easily personalize your website based on visitor location. Increase engagement, conversions and revenue using geo targeting. 

== Description ==
**[Maki Geo](https://makiplugins.com/ "Maki Geo")** helps you create content that resonates with local audiences by geo targeting. 

## Features
**🎯 Geo targeting:** Target visitors based on continent, country, state/province, city, or IP address with precision.
**🧠 Smart Content Display:** Show different text, images, banners, JavaScript, and popups based on visitor location.
**📍 Location information:** Display visitor's country, state, city and flag anywhere on your website.
**⚙️ Advanced Rule Editor:** Create complex targeting rules like "user in USA but _not_ in Texas" with our intuitive editor.

## Use cases
**💰 Affiliate Marketing**: Show location-specific bonuses, deals, and affiliate offers to maximize conversion rates & revenue in each region.
**🛍️ E-commerce**: Display region-appropriate products, pricing, and shipping options based on visitor area.
**🌎 Content Localization**: Deliver region-specific blog posts, news, and multimedia content that local audiences will love.


## How it works
* **Showing or hiding content based on user location.** Maki Geo contains Gutenberg blocks that can be set to show or hide based on a given geo location. You can fill these blocks with your custom content, like text, images or javascript.
Alternatively, you can use the shortcode, for example: `[mgeo_content country="Canada"] Geo targeted content for Canada [/mgeo_content]`.

* **Showing the user's location on your page.** These shortcodes are supported: `[mgeo_country_flag]`, `[mgeo_country]`, `[mgeo_region]` (for state or province) and `[mgeo_city]`.

## Paid service

Maki Geo works by requesting the user location from our location services API. You can use all features of the Maki Geo plugin for free for up to 1000 location API requests per month. After this, you're required to upgrade your license to support more requests by going to our website. 

== Screenshots ==

1. Example of using Maki Geo to show a popup that redirects the user to a localized version of the website.
2. The setup of the popup using the Geo Popup Gutenberg block.
3. Shortcodes that show user location data.
4. What the shortcodes look like to the user.
5. Show/hide any content to users in specific locations by using the Geo Content block.

== Frequently Asked Questions ==

= Is Maki Geo easy to use for non-technical users? =
Yes, Maki Geo integrates into the default Gutenberg editor that you can use to customize your posts and pages. To show or hide content for specific locations, all you have to do is drag and drop your content into the Maki Geo Content block. The settings on the block allow you to choose the area it should target.

For showing the country, state/province, city or flag of a user, we have easy shortcodes. For example, just put [mgeo_country] anywhere in your post and it will be converted to the name of the user's country.

= Is Maki Geo free? =

All features of the plugin are free to use by themselves, but the location API is limited to 1000 requests per month for free users. You can upgrade your license on [our website](https://makiplugins.com).

An API request is used when a new IP address is used to visit your geo targeted content. We cache the IP so multiple requests by the same IP in a short timespan don't count as multiple requests. Maki Geo doesn't consume a request on pages without geo targeted content.


== Changelog ==

= 1.0.0 =
* Initial version of Maki Geo.

== Upgrade Notice ==

= 1.0.0 =
Initial version of Maki Geo.
