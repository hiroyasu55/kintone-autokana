/*
 * Zendesk for kintone of sample program
 * Copyright (c) 2015 Cybozu
 *
 * Licensed under the MIT License
 */
jQuery.noConflict();

(function($, PLUGIN_ID) {

    "use strict";

    $(document).ready(function() {

        // localStorage
        var LOCAL_STORAGE_PREFIX = 'kintone.plugin.' + PLUGIN_ID;
        var LOCAL_STORAGE_JUDGED_ALLOW_ACCESS = LOCAL_STORAGE_PREFIX + '.judgedAllowAccess';
        // spacer ID prefix
        var SPACER_ID_PREFIX = 'user-js-';

        var language = kintone.getLoginUser().language;

        var config;
        var zendesk_users = {};

        var terms = {
            'en': {
                'notice': 'You need to allow kintone to access your Zendesk account to get related Zendesk tickets.',
                'noticeInIframe': 'From the Notifications page, you cannot access the Zendesk ticket. Click here to display the record details page and authenticate with your Zendesk account.',
                'noTickets': 'No Zendesk tickets found.',
                'prev': '&lt;Previous',
                'next': 'Next&gt;'
            },
            'ja': {
                'notice': 'You need to allow kintone to access your Zendesk account to get related Zendesk tickets.',
                'noticeInIframe': 'From the Notifications page, you cannot access the Zendesk ticket. Click here to display the record details page and authenticate with your Zendesk account.',
                'noTickets': 'No Zendesk tickets found.',
                'prev': '&lt;Previous',
                'next': 'Next&gt;'
            },
            'zh': {
                'notice': 'You need to allow kintone to access your Zendesk account to get related Zendesk tickets.',
                'noticeInIframe': 'From the Notifications page, you cannot access the Zendesk ticket. Click here to display the record details page and authenticate with your Zendesk account.',
                'noTickets': 'No Zendesk tickets found.',
                'prev': '&lt;Previous',
                'next': 'Next&gt;'
            }
        };

        var template = {
            initTemplate: function() {/*
<div class='zendeskPlugin-desktop-init-cybozu ${plugin_id}'>
  <div class='app-plugin-admin-message-gaia'>
    <div>
      <a href='javascript:void(0)' onclick='${plugin_id}_zendeskApi.getAccessToken();'>${terms.notice}</a>
    </div>
  </div>
</div>
            */;},

            initTemplateInIframe: function() {/*
<div class='zendeskPlugin-desktop-init-cybozu ${plugin_id}'>
  <div class='app-plugin-admin-message-gaia'>
    <div>
      <a href='${detailpage_url}' target='_top'>${terms.noticeInIframe}</a>
    </div>
  </div>
</div>
            */;},

            noTicketsTemplate: function() {/*
<div class='zendeskPlugin-desktop-noTickets-cybozu ${plugin_id}'>
  ${terms.noTickets}
</div>
            */;},

            resultSetTemplate: function() {/*
<div class='zendeskPlugin-desktop-resultSet-cybozu ${plugin_id}'>
  <div class='zendeskPlugin-desktop-resultSet-pagenation-cybozu' style='display: ${display_pagenation};'>
    <a class='${prev_link.clazz}' href='javascript:void(0)' onclick='${plugin_id}_zendeskApi.search("${prev_link.url}");'>
      <span class='prev' id='zendeskPlugin-desktop-resultSet-pagenation-prev'>${terms.prev}</span>
    </a>
    <a class='${next_link.clazz}' href='javascript:void(0)' onclick='${plugin_id}_zendeskApi.search("${next_link.url}");'>
      <span class='next' id='zendeskPlugin-desktop-resultSet-pagenation-next'>${terms.next}</span>
    </a>
  </div>
  <table class='subtable-gaia reference-subtable-gaia'>
    <thead class='subtable-header-gaia'>
      <tr>
        <th class='subtable-label-gaia subtable-action-gaia' style='width: 1px;'>
          <span></span>
        </th>
        <th class='subtable-label-gaia'>
          <span>Status</span>
        </th>
        <th class='subtable-label-gaia'>
          <span>Ticket ID</span>
        </th>
        <th class='subtable-label-gaia'>
          <span>Subject</span>
        </th>
        <th class='subtable-label-gaia'>
          <span>Requester</span>
        </th>
        <th class='subtable-label-gaia'>
          <span>Updated</span>
        </th>
        <th class='subtable-label-gaia'>
          <span>Priority</span>
        </th>
        <th class='subtable-label-gaia'>
          <span>Assignee</span>
        </th>
      </tr>
    </thead>
    <tbody>
      {{each tickets}}
      <tr>
        <td class='listTable-actionCell-gaia listTable-action-show-gaia'>
          <a class='listTable-action-gaia' title='Show' target='_blank' href='${url}'>
            <span class='show-image-gaia image-link-gaia'>Show</span>
          </a>
        </td>
        <td>
          <div class='control-gaia control-horizon-gaia control-show-gaia'>
            <div class='control-value-gaia'><span class='control-value-content-gaia zendesk_ticket_status_label compact ${status}'>${status_short}</span></div>
            <div class='control-design-gaia'></div>
         </div>
        </td>
        <td>
          <div class='control-gaia control-horizon-gaia control-show-gaia'>
            <div class='control-value-gaia'><span class='control-value-content-gaia'>#${id}</span></div>
            <div class='control-design-gaia'></div>
         </div>
        </td>
        <td>
          <div class='control-gaia control-horizon-gaia control-show-gaia'>
            <div class='control-value-gaia'><span class='control-value-content-gaia'>${subject}</span></div>
            <div class='control-design-gaia'></div>
         </div>
        </td>
        <td>
          <div class='control-gaia control-horizon-gaia control-show-gaia'>
            <div class='control-value-gaia'><span class='control-value-content-gaia' id='user-id-${requester_id}'></span></div>
            <div class='control-design-gaia'></div>
         </div>
        </td>
        <td>
          <div class='control-gaia control-horizon-gaia control-show-gaia'>
            <div class='control-value-gaia'><span class='control-value-content-gaia'>${updated}</span></div>
            <div class='control-design-gaia'></div>
         </div>
        </td>
        <td>
          <div class='control-gaia control-horizon-gaia control-show-gaia'>
            <div class='control-value-gaia'><span class='control-value-content-gaia'>${priority}</span></div>
            <div class='control-design-gaia'></div>
         </div>
        </td>
        <td>
          <div class='control-gaia control-horizon-gaia control-show-gaia'>
            <div class='control-value-gaia'><span class='control-value-content-gaia' id='user-id-${assignee_id}'></span></div>
            <div class='control-design-gaia'></div>
         </div>
        </td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  <div class='zendeskPlugin-desktop-resultSet-pagenation-cybozu' style='display: ${display_pagenation};'>
    <a class='${prev_link.clazz}' href='javascript:void(0)' onclick='${plugin_id}_zendeskApi.search("${prev_link.url}");'>
      <span class='prev' id='zendeskPlugin-desktop-resultSet-pagenation-prev'>${terms.prev}</span>
    </a>
    <a class='${next_link.clazz}' href='javascript:void(0)' onclick='${plugin_id}_zendeskApi.search("${next_link.url}");'>
      <span class='next' id='zendeskPlugin-desktop-resultSet-pagenation-next'>${terms.next}</span>
    </a>
  </div>
</div>
            */;},

            errorTemplate: function() {/*
<div class='zendeskPlugin-desktop-error-cybozu ${plugin_id}'>
  ${error.error}: ${error.description}
</div>
            */;},

            targetSpaceSelector: function() { return '#' + SPACER_ID_PREFIX + config.cf_result_set_display_field },

            _tmpl: function(template, value) {
                // terms
                var localized_terms = (language in terms) ? terms[language] : terms['en'];
                var valueWithTerms = (typeof value === 'undefined') ? {} : value;
                valueWithTerms['plugin_id'] = PLUGIN_ID;
                valueWithTerms['terms'] = localized_terms;

                var selector = this.targetSpaceSelector();
                var parsed_template = template.toString().replace(/^[\s\S]*\/\*(\r\n|\n)|(\r\n|\n)\s*\*\/;\}$/g, '');
                $(selector).html($.tmpl(parsed_template, valueWithTerms));

                // replace fixed height/width to auto
                $(selector).closest('.layout-gaia').css({'width': 'auto'});
                $(selector).closest('.control-etc-gaia').css({'width': 'auto', 'height': 'auto'});
            },

            init: function(event) {
                if (window === window.parent) {
                    this._tmpl(this.initTemplate);
                } else {
                    // in iframe
                    this._tmpl(this.initTemplateInIframe, {'detailpage_url': location.href});
                }
            },

            noTickets: function() {
                this._tmpl(this.noTicketsTemplate);
            },

            setResultSet: function(resultSet) {
                this._tmpl(this.resultSetTemplate, resultSet);
            },

            setUserName: function(userNames) {
                var space_selector = this.targetSpaceSelector();
                for (var id in userNames) {
                    var selector = space_selector + ' #user-id-' + id;
                    $(selector).text(userNames[id]);
                }
            },

            error: function(message) {
                this._tmpl(this.errorTemplate, message);
            }
        };

        function format_datetime(datetime) {
            // assume YYYY-MM-DDTHH:MM:SSZ format only.
            var simpleISO8601 = (function (datetime) {
                var regexp  = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})Z$/;

                var matchedArray = regexp.exec(datetime);
                var success = (matchedArray.length === 7) ? true : false;

                return {
                    "success": success,
                    "original": matchedArray[0],
                    "year": success ? matchedArray[1] : '',
                    "month": success ? matchedArray[2] : '',
                    "day": success ? matchedArray[3] : '',
                    "hour": success ? matchedArray[4] : '',
                    "min": success ? matchedArray[5] : '',
                    "sec": success ? matchedArray[6] : ''
                };
            });

            var monthStr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            var zeroPadding = function(value) { return ('0' + value).slice(-2); };

            var parsed_datetime = simpleISO8601(datetime);
            var formatted_datetime = parsed_datetime.original;
            if (parsed_datetime.success) {
                // assume that parsed_datetime is UTC time.
                var date = new Date();
                date.setUTCFullYear(parsed_datetime.year, parsed_datetime.month - 1, parsed_datetime.day);
                date.setUTCHours(parsed_datetime.hour, parsed_datetime.min, parsed_datetime.sec);

                var now = new Date();
                if (date.getFullYear() !== now.getFullYear()) {
                    // MM DD, YYYY
                    formatted_datetime = monthStr[date.getMonth()] + ' ' + zeroPadding(date.getDate()) + ', ' + date.getFullYear();
                } else if (date.getMonth() !== now.getMonth() || date.getDate() !== now.getDate()) {
                    // MM DD
                    formatted_datetime = monthStr[date.getMonth()] + ' ' + zeroPadding(date.getDate());
                } else {
                    // HH:MM
                    formatted_datetime = zeroPadding(date.getHours()) + ':' + zeroPadding(date.getMinutes());
                }
            }

            return formatted_datetime;
        }

        var judgedAllowAccessFlag = {
            isSet: function() {
                return (localStorage.getItem(LOCAL_STORAGE_JUDGED_ALLOW_ACCESS) !== null);
            },

            set: function() {
                localStorage.setItem(LOCAL_STORAGE_JUDGED_ALLOW_ACCESS, 'true');
            },

            remove: function() {
                localStorage.removeItem(LOCAL_STORAGE_JUDGED_ALLOW_ACCESS);
            }
        };

        var zendeskApi = {
            clientInfo: {"provider": "zendesk", "plugin": PLUGIN_ID},

            getAccessToken: function() {
                // add a hash parameter for distinguishing OAuth redirect
                var delimiter = (location.hash.indexOf('#') === 0) ? '&' : '#';
                location.hash += delimiter + PLUGIN_ID + '.oauth_redirect=true';

                kintone.oauth.redirectToAuthenticate(this.clientInfo, location.href);
            },

            _createUrl: function(path) {
                return 'https://' + config.cf_domain + '.zendesk.com/api/v2/' + path;
            },

            _createFilterCondition: function(conf, propertyName) {
                var condition = '';

                var filter = JSON.parse(conf);
                var filterArray = [];
                for (var key in filter) {
                    filterArray.push(filter[key].value);
                }
                if (filterArray.length > 0) {
                    condition += '%20' + propertyName + ':' + filterArray.join('%20' + propertyName + ':');
                }

                return condition;
            },

            search: function(url) {
                if (url.length === 0) {
                    return false;
                }

                kintone.oauth.proxy(this.clientInfo, url, 'GET', {}, {}, function(body, status, headers) {

                    var parsed_JSON = JSON.parse(body);

                    // error
                    if (status !== 200) {
                        template.error({"error": {"error": parsed_JSON.error, "description": parsed_JSON.description}});
                        return;
                    }

                    // no Zendesk tickets
                    if (!parsed_JSON.count) {
                        template.noTickets();
                        return;
                    }

                    var results = parsed_JSON.results;
                    var tickets = [];
                    var users = [];
                    var baseUrl = 'https://' + config.cf_domain + '.zendesk.com/agent/#/tickets/';
                    for (var key in results) {
                        tickets.push({"url": baseUrl + results[key].id,
                                      "status": results[key].status,
                                      "status_short": results[key].status.substr(0, 1),
                                      "id": results[key].id,
                                      "subject": results[key].subject,
                                      "requester": results[key].requester_id,
                                      "requester_id": results[key].requester_id,
                                      "updated": format_datetime(results[key].updated_at),
                                      "priority": results[key].priority,
                                      "assignee": results[key].assignee_id,
                                      "assignee_id": results[key].assignee_id});

                        if ($.inArray(results[key].requester_id, users) === -1) {
                            users.push(results[key].requester_id);
                        }
                        if ($.inArray(results[key].assignee_id, users) === -1) {
                            users.push(results[key].assignee_id);
                        }
                    }

                    // control pagenation
                    var display_pagenation = 'none';
                    var next_link = {"clazz": 'disabled', "url": null};
                    var prev_link = {"clazz": 'disabled', "url": null};
                    if (parsed_JSON.next_page !== null) {
                        display_pagenation = 'block';
                        next_link['clazz'] = 'enabled';
                        next_link['url'] = parsed_JSON.next_page;
                    }
                    if (parsed_JSON.previous_page !== null) {
                        display_pagenation = 'block';
                        prev_link['clazz'] = 'enabled';
                        prev_link['url'] = parsed_JSON.previous_page;
                    }

                    // set template
                    template.setResultSet({"display_pagenation": display_pagenation,
                                           "next_link": next_link,
                                           "prev_link": prev_link,
                                           "tickets": tickets});

                    // get Zendesk user names
                    zendeskApi.usersShowMany(users);

                }, function(body) {
                });
            },

            searchWithQuery: function(query) {
                if (query.length === 0) {
                    return false;
                }

                var url = this._createUrl('search.json?query=' + query);
                this.search(url);
            },

            usersShowMany: function(ids) {

                if (ids.length === 0) {
                    return;
                }

                var new_users = [];
                for (var id in ids) {
                    if (!(String(ids[id]) in zendesk_users)) {
                        new_users.push(ids[id]);
                    }
                }
                if (new_users.length === 0) {
                    template.setUserName(zendesk_users);
                    return;
                }

                // API "show_many.json" doesn't return "next_page" value.
                // So get max 100 users data per a request.
                // see "Collections" in http://developer.zendesk.com/documentation/rest_api/introduction.html
                var maxUsersPerRequest = 100;
                while (new_users.length > 0) {
                    var target_users = new_users.splice(0, maxUsersPerRequest);
                    for (var key in target_users) {
                        target_users[key] = encodeURIComponent(target_users[key]);
                    }

                    var url = this._createUrl('users/show_many.json?ids=' + target_users.join());
                    kintone.oauth.proxy(this.clientInfo, url, 'GET', {}, {}, function(body, status, headers) {
                        var users = JSON.parse(body).users;
                        for (var keyU in users) {
                            zendesk_users[String(users[keyU].id)] = users[keyU].name;
                        }

                        template.setUserName(zendesk_users);
                    }, function(body) {
                    });
                }
            }
        };
        eval("window." + PLUGIN_ID + "_zendeskApi = zendeskApi;");

        kintone.events.on('app.record.detail.show', function(event) {
            // load config
            config = kintone.plugin.app.getConfig(PLUGIN_ID);

            // client info
            zendeskApi.clientInfo.client = config.cf_client_name;
            zendeskApi.clientInfo.subdomain = config.cf_domain;
            zendeskApi.clientInfo.app = event.appId;

            var oauth_redirect_param = PLUGIN_ID + '.oauth_redirect=true';
            if (location.hash.indexOf(oauth_redirect_param) !== -1) {
                judgedAllowAccessFlag.set();

                // remove a hash parameter
                location.hash = location.hash.replace(oauth_redirect_param, '');
            }

            var hasAccessToken = kintone.oauth.hasAccessToken(zendeskApi.clientInfo);
            if (!judgedAllowAccessFlag.isSet() || !hasAccessToken) {
                if (hasAccessToken) {
                    kintone.oauth.clearAccessToken(zendeskApi.clientInfo, function(body, status, headers) {
                        template.init(event);
                    });
                } else {
                    template.init(event);
                }
            } else {
                // existence check the target search field and result set display field
                if (typeof event.record[config.cf_search_field] === 'undefined') {
                    // no target search field
                    template.noTickets();
                    return;
                }
                if (!$(template.targetSpaceSelector())[0]) {
                    // no result set display field
                    return;
                }

                // use the value of which type is 'RECORD_NUMBER' if the field code is '$id'
                var search_field_code = config.cf_search_field;
                if (config.cf_search_field === '$id') {
                    for (var key in event.record) {
                        if (event.record[key].type === 'RECORD_NUMBER') {
                            search_field_code = key;
                            break;
                        }
                    }
                }

                // search condition
                var kintone_field_value = event.record[search_field_code].value;
                if (kintone_field_value.length === 0) {
                    // key value is empty
                    template.noTickets();
                    return;
                }
                var query = 'type:ticket%20' + config.cf_search_property + ':%22' + encodeURIComponent(kintone_field_value) + '%22';

                // filter conditions
                query += zendeskApi._createFilterCondition(config.cf_status, 'status');
                query += zendeskApi._createFilterCondition(config.cf_ticket_type, 'ticket_type');
                query += zendeskApi._createFilterCondition(config.cf_priority, 'priority');

                // sort
                query += '%20order_by:updated_at%20sort:desc';

                // search
                zendeskApi.searchWithQuery(query);
            }
        });

    });

})(jQuery, kintone.$PLUGIN_ID);
