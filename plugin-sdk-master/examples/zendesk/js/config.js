jQuery.noConflict();

(function($, PLUGIN_ID) {

    "use strict";

    $(document).ready(function() {

        var terms = {
            'en': {
                'domain': 'Zendesk Domain Name',
                'oauth': 'OAuth Client',
                'client_name': 'Unique Identifier',
                'secret': 'Secret',
                'search_condition': 'Fetch Criteria',
                'fetch_criteria_desc': 'Pick what field from kintone you want to' +
                'match with a value in Zendesk. Zendesk tickets will be returned and ' +
                'displayed based off tickets that match this criteria.',
                'kintone_field': 'kintone Field',
                'zendesk': 'Zendesk',
                'zendesk_ticket': 'Ticket',
                'zendesk_property': 'Property',
                'search_operator': '= (equal to)',
                'filter_condition': 'Filter',
                'zendesk_status': 'Status',
                'zendesk_status_new': 'New',
                'zendesk_status_open': 'Open',
                'zendesk_status_pending': 'Pending',
                'zendesk_status_hold': 'Hold',
                'zendesk_status_solved': 'Solved',
                'zendesk_status_closed': 'Closed',
                'zendesk_ticket_type': 'Type',
                'zendesk_ticket_type_null': 'Not set',
                'zendesk_ticket_type_question': 'Question',
                'zendesk_ticket_type_incident': 'Incident',
                'zendesk_ticket_type_problem': 'Problem',
                'zendesk_ticket_type_task': 'Task',
                'zendesk_priority': 'Priority',
                'zendesk_priority_null': 'Not set',
                'zendesk_priority_low': 'Low',
                'zendesk_priority_normal': 'Normal',
                'zendesk_priority_high': 'High',
                'zendesk_priority_urgent': 'Urgent',
                'result_set_display_field': 'Zendesk Ticket Placeholder on kintone',
                'result_set_desc': 'Select the placeholder field on kintone form to display' +
                'Zendesk tickets. The placeholder field type should be blank space.',
                'save': 'Save',
                'cancel': 'Cancel'
            },
            'ja': {
                'domain': 'Zendesk Domain Name',
                'oauth': 'OAuth Client',
                'client_name': 'Unique Identifier',
                'secret': 'Secret',
                'search_condition': 'Fetch Criteria',
                'fetch_criteria_desc': 'Pick what field from kintone you want to' +
                'match with a value in Zendesk. Zendesk tickets will be returned and ' +
                'displayed based off tickets that match this criteria.',
                'kintone_field': 'kintone Field',
                'zendesk': 'Zendesk',
                'zendesk_ticket': 'Ticket',
                'zendesk_property': 'Property',
                'search_operator': '= (equal to)',
                'filter_condition': 'Filter',
                'zendesk_status': 'Status',
                'zendesk_status_new': 'New',
                'zendesk_status_open': 'Open',
                'zendesk_status_pending': 'Pending',
                'zendesk_status_hold': 'Hold',
                'zendesk_status_solved': 'Solved',
                'zendesk_status_closed': 'Closed',
                'zendesk_ticket_type': 'Type',
                'zendesk_ticket_type_null': 'Not set',
                'zendesk_ticket_type_question': 'Question',
                'zendesk_ticket_type_incident': 'Incident',
                'zendesk_ticket_type_problem': 'Problem',
                'zendesk_ticket_type_task': 'Task',
                'zendesk_priority': 'Priority',
                'zendesk_priority_null': 'Not set',
                'zendesk_priority_low': 'Low',
                'zendesk_priority_normal': 'Normal',
                'zendesk_priority_high': 'High',
                'zendesk_priority_urgent': 'Urgent',
                'result_set_display_field': 'Zendesk Ticket Placeholder on kintone',
                'result_set_desc': 'Select the placeholder field on kintone form to display' +
                'Zendesk tickets. The placeholder field type should be blank space.',
                'save': 'Save',
                'cancel': 'Cancel'
            },
            'zh': {
                'domain': 'Zendesk Domain Name',
                'oauth': 'OAuth Client',
                'client_name': 'Unique Identifier',
                'secret': 'Secret',
                'search_condition': 'Fetch Criteria',
                'fetch_criteria_desc': 'Pick what field from kintone you want to' +
                'match with a value in Zendesk. Zendesk tickets will be returned and ' +
                'displayed based off tickets that match this criteria.',
                'kintone_field': 'kintone Field',
                'zendesk': 'Zendesk',
                'zendesk_ticket': 'Ticket',
                'zendesk_property': 'Property',
                'search_operator': '= (equal to)',
                'filter_condition': 'Filter',
                'zendesk_status': 'Status',
                'zendesk_status_new': 'New',
                'zendesk_status_open': 'Open',
                'zendesk_status_pending': 'Pending',
                'zendesk_status_hold': 'Hold',
                'zendesk_status_solved': 'Solved',
                'zendesk_status_closed': 'Closed',
                'zendesk_ticket_type': 'Type',
                'zendesk_ticket_type_null': 'Not set',
                'zendesk_ticket_type_question': 'Question',
                'zendesk_ticket_type_incident': 'Incident',
                'zendesk_ticket_type_problem': 'Problem',
                'zendesk_ticket_type_task': 'Task',
                'zendesk_priority': 'Priority',
                'zendesk_priority_null': 'Not set',
                'zendesk_priority_low': 'Low',
                'zendesk_priority_normal': 'Normal',
                'zendesk_priority_high': 'High',
                'zendesk_priority_urgent': 'Urgent',
                'result_set_display_field': 'Zendesk Ticket Placeholder on kintone',
                'result_set_desc': 'Select the placeholder field on kintone form to display' +
                'Zendesk tickets. The placeholder field type should be blank space.',
                'save': 'Save',
                'cancel': 'Cancel'
            }
        };

        var lang = kintone.getLoginUser().language;
        var i18n = (lang in terms) ? terms[lang] : terms['en'];

        var configHtml = $('#zendesk-plugin').html();
        var tmpl = $.templates(configHtml);
        $('div#zendesk-plugin').html(tmpl.render({'terms': i18n}));

        function setCheckBoxSetting(config) {
            if (typeof config !== 'undefined') {
                var configArray = JSON.parse(config);
                for (var key in configArray) {
                    if (configArray.hasOwnProperty(key)) {
                        $('#' + configArray[key].name + '_' + configArray[key].value).prop('checked', true);
                    }
                }
            }
        }

        function setOptions() {
            var config = kintone.plugin.app.getConfig(PLUGIN_ID);
            $('#cf_domain').val(config.cf_domain);
            $('#cf_client_name').val(config.cf_client_name);
            $('#cf_secret').val(config['_oauth_client_secret:zendesk']);
            $('#cf_search_field').val(config.cf_search_field);
            $('#cf_search_property').val(config.cf_search_property === null ? 'assignee' :
                config.cf_search_property);
            setCheckBoxSetting(config.cf_status);
            setCheckBoxSetting(config.cf_ticket_type);
            setCheckBoxSetting(config.cf_priority);
            $('#cf_result_set_display_field').val(config.cf_result_set_display_field);
        }

        // initialize
        setOptions();

        // set kintone fields
        var search_fields = [{"code": "$id", "label": "Record number"}]; // "Record number" is always set.
        var result_set_display_fields = [];
        var matchedGuestSpacePath = location.pathname.match(/^\/k\/(guest\/\d+\/)/);
        var guestSpacePath = '';
        if (matchedGuestSpacePath !== null && matchedGuestSpacePath.length === 2) {
            guestSpacePath = matchedGuestSpacePath[1]; // "guest/<space_id>/"
        }
        var apiPath = '/k/' + guestSpacePath + 'v1/preview/form';
        kintone.api(apiPath, 'GET', {'app': kintone.app.getId()}, function(resp) {
            var props = resp.properties;
            for (var keyP in props) {
                if (props.hasOwnProperty(keyP)) {
                    switch (props[keyP].type) {
                        case 'SINGLE_LINE_TEXT':
                        case 'LINK':
                            search_fields.push({"code": props[keyP].code, "label": props[keyP].label});
                            break;
                        case 'SPACER':
                            if (props[keyP].elementId !== '') {
                                result_set_display_fields.push(props[keyP].elementId);
                            }
                            break;
                        default:
                            // unsupported field
                            break;
                    }
                }
            }

            // set search field dropdown
            for (var keyF in search_fields) {
                if (props.hasOwnProperty(keyF)) {
                    var optionF = $('<OPTION>').text(search_fields[keyF].label).val(search_fields[keyF].code);
                    $('#cf_search_field').append(optionF);
                }
            }

            // set result set display field dropdown
            for (var keyD in result_set_display_fields) {
                if (props.hasOwnProperty(keyD)) {
                    var optionD = $('<OPTION>').text(result_set_display_fields[keyD]).
                    val(result_set_display_fields[keyD]);
                    $('#cf_result_set_display_field').append(optionD);
                }
            }

            // restore configuration
            setOptions();

            // enable submit button
            $('#cf_submit').removeAttr('disabled');
        }, function(resp) {
        });

        // submit button
        $('#cf_submit').click(function() {

            // return '' if 'null' or 'undefined'
            var getSafeValue = function(value) { return value === null ? '' : value; };

            var config = {
                'cf_domain': $('#cf_domain').val(),
                'cf_client_name': $('#cf_client_name').val(),
                '_oauth_client_secret:zendesk': $('#cf_secret').val(),
                'cf_search_field': getSafeValue($('#cf_search_field').val()),
                'cf_search_property': $('#cf_search_property').val(),
                'cf_status': JSON.stringify($('[name="cf_status"]:checked').serializeArray()),
                'cf_ticket_type': JSON.stringify($('[name="cf_ticket_type"]:checked').serializeArray()),
                'cf_priority': JSON.stringify($('[name="cf_priority"]:checked').serializeArray()),
                'cf_result_set_display_field': getSafeValue($('#cf_result_set_display_field').val())
            };
            kintone.plugin.app.setConfig(config);
        });

        // cancel button
        $('#cancel').click(function() {
            history.back();
        });

    });

})(jQuery, kintone.$PLUGIN_ID);
