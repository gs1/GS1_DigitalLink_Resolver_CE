/*
This SQL scripts create teh database used by the data entry application. If you are running this script in a container then
all is fine. If you are running this in a cloud server such as SQL Azure or existing database server on your network,
you may need to review or remove the first section below.
For example, if you are suing SQL Azure then the database and user will have been setup for you.
 */

/****************************************************** START OF SECTION TO CHECK BASED ON SQL SERVER IMPLEMENTATION ************/

sp_configure 'contained database authentication', 1;
GO
RECONFIGURE
GO

If(db_id(N'gs1resolverdb') IS NULL)
BEGIN
    CREATE DATABASE  [gs1resolverdb] CONTAINMENT = PARTIAL
END
GO

USE  [gs1resolverdb]
GO

/* The create user statements below should only be used on a self-standing database
   such as the one created in its own container if you run the docker / docker-compose commands.
   If you are using an existing database server or cloud database such as SQL Azure then you may
   have already been given login information, in which case delete the commands below before running
   this script.
 */
CREATE USER dataentry_user WITH PASSWORD='feorfhgofgq348ryfwfAHGAU',  DEFAULT_LANGUAGE=[English], DEFAULT_SCHEMA=[gs1resolver_dataentry_db]


GRANT EXECUTE TO dataentry_user
GO


/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[search_request_uris_by_gs1_key_value]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[search_request_uris_by_gs1_key_value]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[save_new_uri_response]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[save_new_uri_response]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[save_new_session]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[save_new_session]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[save_existing_uri_response]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[save_existing_uri_response]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[save_existing_uri_request]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[save_existing_uri_request]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[save_existing_account]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[save_existing_account]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[logThis]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[logThis]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[list_members_for_gs1_mo]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[list_members_for_gs1_mo]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[list_gs1_mos]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[list_gs1_mos]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[list_accounts_for_member]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[list_accounts_for_member]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[is_session_active]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[is_session_active]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[is_administrator]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[is_administrator]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[HEALTH_save_healthcheck]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[HEALTH_save_healthcheck]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[HEALTH_get_1000_responses_to_healthcheck]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[HEALTH_get_1000_responses_to_healthcheck]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_session]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_session]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_response_uris_for_request]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_response_uris_for_request]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_request_uris]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_request_uris]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_request_uri_status]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_request_uri_status]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_request_uri_for_edit]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_request_uri_for_edit]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_mime_types_list]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_mime_types_list]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_member_primary_gln_from_session_id]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_member_primary_gln_from_session_id]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_linktypes_list]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_linktypes_list]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_key_code_components_list]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_key_code_components_list]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_contexts_list]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_contexts_list]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_active_linktypes_list]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_active_linktypes_list]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_account_details]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_account_details]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_1000_responses_to_healthcheck]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[get_1000_responses_to_healthcheck]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[delete_uri_response]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[delete_uri_response]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[create_new_uri_request]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[create_new_uri_request]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[check_for_duplicate_request_record]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[check_for_duplicate_request_record]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[change_password]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[change_password]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[delete_uri_request]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[delete_uri_request]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_SetToRequireRebuild]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[BUILD_SetToRequireRebuild]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_GetURIResponses]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[BUILD_GetURIResponses]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_GetURIRequests]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[BUILD_GetURIRequests]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_GetURIRequestCount]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[BUILD_GetURIRequestCount]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_get_gcp_resolves_list]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[BUILD_get_gcp_resolves_list]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_FlagUriRequestAsBuilt]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[BUILD_FlagUriRequestAsBuilt]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_DeleteUriRecord]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[BUILD_DeleteUriRecord]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_mime_types_item]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_mime_types_item]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_member]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_member]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_linktypes_item]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_linktypes_item]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_gs1mo]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_gs1mo]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_gs1_key_components_item]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_gs1_key_components_item]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_gs1_key_component]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_gs1_key_component]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_contexts_item]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_contexts_item]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_account]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_account]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_existing_mime_types_item]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_existing_mime_types_item]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_existing_linktypes_item]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_existing_linktypes_item]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_existing_gs1_key_components_item]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_existing_gs1_key_components_item]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_existing_contexts_item]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_existing_contexts_item]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_list_accounts]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_list_accounts]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_change_password]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_change_password]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_administrator_level]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[ADMIN_administrator_level]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[account_login]    Script Date: 03/10/2019 14:08:25 ******/
DROP PROCEDURE [gs1resolver_dataentry_db].[account_login]
GO

DROP PROCEDURE [gs1resolver_dataentry_db].[search_request_uris_by_gs1_key_code_and_value]
GO

DROP PROCEDURE [gs1resolver_dataentry_db].[search_request_uris_by_gs1_key_code]
GO

DROP PROCEDURE [gs1resolver_dataentry_db].[search_request_uris_by_gs1_key_value]
GO



ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] DROP CONSTRAINT [DF__uri_respo__activ__3E1D39E1]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] DROP CONSTRAINT [DF__uri_respo__forwa__41EDCAC5]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] DROP CONSTRAINT [DF_uri_responses_default_mime_type]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] DROP CONSTRAINT [DF_uri_responses_default_context]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] DROP CONSTRAINT [DF_uri_responses_default_iana_language]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] DROP CONSTRAINT [DF_uri_responses_default_linktype]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] DROP CONSTRAINT [DF__uri_respo__desti__3B40CD36]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] DROP CONSTRAINT [DF__uri_respo__alt_a__3D2915A8]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] DROP CONSTRAINT [DF__uri_respo__desti__40F9A68C]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] DROP CONSTRAINT [DF_uri_responses_context]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] DROP CONSTRAINT [DF__uri_respo__iana___3864608B]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] DROP CONSTRAINT [DF__uri_respo__attri__3A4CA8FD]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_response_health_checks] DROP CONSTRAINT [DF__uri_respo__lates__55EAA1D1]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_response_health_checks] DROP CONSTRAINT [DF__uri_respo__attem__54F67D98]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_response_health_checks] DROP CONSTRAINT [DF__uri_respo__healt__5402595F]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_response_health_checks] DROP CONSTRAINT [DF__uri_respo__uri_r__530E3526]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF_uri_requests_flagged_for_deletion]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__api_b__32AB8735]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__activ__29221CFB]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__inclu__31B762FC]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__web_u__30C33EC3]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__web_u__2FCF1A8A]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__web_u__2EDAF651]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__web_u__2DE6D218]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__web_u__2CF2ADDF]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__web_u__2BFE89A6]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__web_u__2B0A656D]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__web_u__2A164134]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__date___282DF8C2]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__date___2739D489]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__item___2645B050]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__gs1_k__25518C17]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__gs1_k__245D67DE]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] DROP CONSTRAINT [DF__uri_reque__membe__236943A5]
GO
ALTER TABLE [gs1resolver_dataentry_db].[sessions] DROP CONSTRAINT [DF__sessions__dateti__5C2D8B0C]
GO
ALTER TABLE [gs1resolver_dataentry_db].[members] DROP CONSTRAINT [DF__members__active__2180FB33]
GO
ALTER TABLE [gs1resolver_dataentry_db].[members] DROP CONSTRAINT [DF__members__notes__208CD6FA]
GO
ALTER TABLE [gs1resolver_dataentry_db].[members] DROP CONSTRAINT [DF__members__member___1F98B2C1]
GO
ALTER TABLE [gs1resolver_dataentry_db].[members] DROP CONSTRAINT [DF__members__gs1_mo___1EA48E88]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_mime_types] DROP CONSTRAINT [DF_list_mime_types_default_mime_type_flag]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_linktypes] DROP CONSTRAINT [DF__list_link__appli__3C2ACFCE]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_linktypes] DROP CONSTRAINT [DF__list_link__linkt__3B36AB95]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_gs1_key_components] DROP CONSTRAINT [DF__list_gs1___accep__548C6944]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_gs1_key_components] DROP CONSTRAINT [DF__list_gs1___compo__5398450B]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_gs1_key_components] DROP CONSTRAINT [DF__list_gs1___compo__52A420D2]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_contexts] DROP CONSTRAINT [DF_list_contexts_default_context]
GO
ALTER TABLE [gs1resolver_dataentry_db].[gs1_mos] DROP CONSTRAINT [DF__gs1_mos__organis__30EE274C]
GO
ALTER TABLE [gs1resolver_dataentry_db].[gcp_resolves] DROP CONSTRAINT [DF_gcp_resolves_api_builder_processed]
GO
ALTER TABLE [gs1resolver_dataentry_db].[audit_log] DROP CONSTRAINT [DF_audit_log_entryDateTime]
GO
ALTER TABLE [gs1resolver_dataentry_db].[accounts] DROP CONSTRAINT [DF__accounts__active__4DDF6BB5]
GO
ALTER TABLE [gs1resolver_dataentry_db].[accounts] DROP CONSTRAINT [DF__accounts__admini__4CEB477C]
GO
ALTER TABLE [gs1resolver_dataentry_db].[accounts] DROP CONSTRAINT [DF__accounts__last_l__4BF72343]
GO
ALTER TABLE [gs1resolver_dataentry_db].[accounts] DROP CONSTRAINT [DF__accounts__accoun__4B02FF0A]
GO
ALTER TABLE [gs1resolver_dataentry_db].[accounts] DROP CONSTRAINT [DF__accounts__surnam__4A0EDAD1]
GO
ALTER TABLE [gs1resolver_dataentry_db].[accounts] DROP CONSTRAINT [DF__accounts__firstn__491AB698]
GO
/****** Object:  Index [uri_request_id_idx]    Script Date: 03/10/2019 14:08:25 ******/
DROP INDEX [uri_request_id_idx] ON [gs1resolver_dataentry_db].[uri_responses]
GO
/****** Object:  Index [member_primary_gln]    Script Date: 03/10/2019 14:08:25 ******/
DROP INDEX [member_primary_gln] ON [gs1resolver_dataentry_db].[uri_requests]
GO
/****** Object:  Index [IX_list_contexts_value]    Script Date: 03/10/2019 14:08:25 ******/
DROP INDEX [IX_list_contexts_value] ON [gs1resolver_dataentry_db].[list_contexts]
GO
/****** Object:  Index [IX_gcp_resolves]    Script Date: 03/10/2019 14:08:25 ******/
DROP INDEX [IX_gcp_resolves] ON [gs1resolver_dataentry_db].[gcp_resolves]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[uri_responses]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[uri_responses]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[uri_response_health_checks]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[uri_response_health_checks]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[uri_requests]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[uri_requests]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[sessions]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[sessions]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[members]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[members]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[list_mime_types]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[list_mime_types]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[list_linktypes]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[list_linktypes]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[list_gs1_key_components]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[list_gs1_key_components]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[list_contexts]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[list_contexts]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[gs1_mos]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[gs1_mos]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[gcp_resolves]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[gcp_resolves]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[audit_log]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[audit_log]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[accounts]    Script Date: 03/10/2019 14:08:25 ******/
DROP TABLE [gs1resolver_dataentry_db].[accounts]
GO
/****** Object:  UserDefinedFunction [gs1resolver_dataentry_db].[PW_ENCRYPT]    Script Date: 03/10/2019 14:08:25 ******/
DROP FUNCTION [gs1resolver_dataentry_db].[PW_ENCRYPT]
GO
/****** Object:  Schema [gs1resolver_dataentry_db]    Script Date: 03/10/2019 14:08:25 ******/
DROP SCHEMA [gs1resolver_dataentry_db]
GO
/****** Object:  Schema [gs1resolver_dataentry_db]    Script Date: 03/10/2019 14:08:25 ******/
CREATE SCHEMA [gs1resolver_dataentry_db]
GO
/****** Object:  UserDefinedFunction [gs1resolver_dataentry_db].[PW_ENCRYPT]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion: DETERMINISTIC.
*/

CREATE FUNCTION [gs1resolver_dataentry_db].[PW_ENCRYPT]
(
    @var_cleartext_password nvarchar(100)
)
    RETURNS nvarchar(100)
AS
BEGIN
    DECLARE @hashbytes as varbinary(50)
    SET @hashbytes = HASHBYTES('SHA2_512', @var_cleartext_password)
    RETURN CONVERT(VARCHAR(1000), HashBytes('MD5', @hashbytes), 2)
END
GO
/****** Object:  Table [gs1resolver_dataentry_db].[accounts]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[accounts](
                                                      [account_id] [int] IDENTITY(30,1) NOT NULL,
                                                      [member_primary_gln] [nchar](13) NOT NULL,
                                                      [firstname] [nvarchar](25) NULL,
                                                      [surname] [nvarchar](45) NULL,
                                                      [login_password] [nvarchar](100) NOT NULL,
                                                      [login_email] [nvarchar](100) NOT NULL,
                                                      [account_notes] [nvarchar](1024) NULL,
                                                      [last_login_datetime] [datetime2](0) NULL,
                                                      [administrator] [nchar](1) NULL,
                                                      [active] [smallint] NULL,
                                                      CONSTRAINT [PK_accounts_account_id] PRIMARY KEY CLUSTERED
                                                          (
                                                           [account_id] ASC
                                                              )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[audit_log]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[audit_log](
                                                       [logEntryId] [bigint] IDENTITY(1,1) NOT NULL,
                                                       [logTimestamp] [datetime] NOT NULL,
                                                       [apiHostMachineId] [nvarchar](50) NOT NULL,
                                                       [logMessage] [nvarchar](max) NOT NULL,
                                                       CONSTRAINT [PK_audit_log] PRIMARY KEY CLUSTERED
                                                           (
                                                            [logEntryId] ASC
                                                               )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[gcp_resolves]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[gcp_resolves](
                                                          [gcp_resolve_id] [int] IDENTITY(1,1) NOT NULL,
                                                          [member_primary_gln] [nchar](13) NOT NULL,
                                                          [gs1_key_code] [nvarchar](20) NOT NULL,
                                                          [gs1_gcp_value] [nvarchar](45) NOT NULL,
                                                          [resolve_url_format] [nvarchar](255) NOT NULL,
                                                          [notes] [nvarchar](255) NULL,
                                                          [api_builder_processed] [smallint] NOT NULL,
                                                          CONSTRAINT [PK_gcp_resolves] PRIMARY KEY CLUSTERED
                                                              (
                                                               [gcp_resolve_id] ASC
                                                                  )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[gs1_mos]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[gs1_mos](
                                                     [gs1_mo_primary_gln] [nchar](13) NOT NULL,
                                                     [organisation_name] [nvarchar](45) NOT NULL,
                                                     CONSTRAINT [PK_gs1_mos_gs1_mo_primary_gln] PRIMARY KEY CLUSTERED
                                                         (
                                                          [gs1_mo_primary_gln] ASC
                                                             )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[list_contexts]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[list_contexts](
                                                           [context_id] [int] IDENTITY(1,1) NOT NULL,
                                                           [context_value] [nvarchar](30) NOT NULL,
                                                           [description] [nvarchar](100) NULL,
                                                           [default_context_flag] [bit] NOT NULL,
                                                           CONSTRAINT [PK_list_contexts_context_id] PRIMARY KEY CLUSTERED
                                                               (
                                                                [context_id] ASC
                                                                   )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[list_gs1_key_components]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[list_gs1_key_components](
                                                                     [gs1_key_component_id] [int] IDENTITY(9,1) NOT NULL,
                                                                     [gs1_key_code] [nvarchar](20) NOT NULL,
                                                                     [component_order] [smallint] NOT NULL,
                                                                     [component_uri_id] [nvarchar](10) NULL,
                                                                     [component_name] [nvarchar](45) NULL,
                                                                     [accepted_formats] [nvarchar](100) NULL,
                                                                     CONSTRAINT [PK_list_alpha_components_alpha_component_id] PRIMARY KEY CLUSTERED
                                                                         (
                                                                          [gs1_key_component_id] ASC
                                                                             )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[list_linktypes]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[list_linktypes](
                                                            [linktype_id] [int] IDENTITY(29,1) NOT NULL,
                                                            [locale] [nvarchar](5) NOT NULL,
                                                            [linktype_name] [nvarchar](50) NOT NULL,
                                                            [linktype_reference_url] [nvarchar](255) NOT NULL,
                                                            [applicable_gs1_key_code] [nvarchar](10) NOT NULL,
                                                            [description] [nvarchar](1024) NOT NULL,
                                                            CONSTRAINT [PK_list_attributes_attribute_id] PRIMARY KEY CLUSTERED
                                                                (
                                                                 [linktype_id] ASC
                                                                    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[list_mime_types]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[list_mime_types](
                                                             [mime_type_id] [int] IDENTITY(1,1) NOT NULL,
                                                             [mime_type_value] [nvarchar](30) NOT NULL,
                                                             [description] [nvarchar](100) NULL,
                                                             [default_mime_type_flag] [bit] NOT NULL,
                                                             CONSTRAINT [PK_list_mime_types_mime_type_id] PRIMARY KEY CLUSTERED
                                                                 (
                                                                  [mime_type_id] ASC
                                                                     )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[members]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[members](
                                                     [member_primary_gln] [nchar](13) NOT NULL,
                                                     [gs1_mo_primary_gln] [nchar](13) NULL,
                                                     [member_name] [nvarchar](255) NULL,
                                                     [notes] [nvarchar](1024) NULL,
                                                     [active] [smallint] NULL,
                                                     [member_logo_url] [nvarchar](max) NULL,
                                                     CONSTRAINT [PK_members_member_primary_gln] PRIMARY KEY CLUSTERED
                                                         (
                                                          [member_primary_gln] ASC
                                                             )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[sessions]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[sessions](
                                                      [session_id] [nchar](50) NOT NULL,
                                                      [account_id] [int] NOT NULL,
                                                      [datetime_created] [datetime2](0) NOT NULL,
                                                      [member_primary_gln] [nchar](13) NOT NULL,
                                                      CONSTRAINT [PK_sessions_session_id] PRIMARY KEY CLUSTERED
                                                          (
                                                           [session_id] ASC
                                                              )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[uri_requests]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[uri_requests](
                                                          [uri_request_id] [int] IDENTITY(1,1) NOT NULL,
                                                          [member_primary_gln] [nchar](13) NOT NULL,
                                                          [gs1_key_code] [nvarchar](20) NOT NULL,
                                                          [gs1_key_value] [nvarchar](45) NOT NULL,
                                                          [item_description] [nvarchar](200) NOT NULL,
                                                          [date_inserted] [datetime2](0) NOT NULL,
                                                          [date_last_updated] [datetime2](0) NOT NULL,
                                                          [web_uri_prefix_1] [nvarchar](10) NOT NULL,
                                                          [web_uri_suffix_1] [nvarchar](45) NOT NULL,
                                                          [web_uri_prefix_2] [nvarchar](10) NOT NULL,
                                                          [web_uri_suffix_2] [nvarchar](45) NOT NULL,
                                                          [web_uri_prefix_3] [nvarchar](10) NOT NULL,
                                                          [web_uri_suffix_3] [nvarchar](45) NOT NULL,
                                                          [web_uri_prefix_4] [nvarchar](10) NOT NULL,
                                                          [web_uri_suffix_4] [nvarchar](45) NOT NULL,
                                                          [include_in_sitemap] [bit] NOT NULL,
                                                          [active] [bit] NOT NULL,
                                                          [api_builder_processed] [bit] NOT NULL,
                                                          [flagged_for_deletion] [bit] NOT NULL,
                                                          CONSTRAINT [PK_uri_requests_uri_request_id] PRIMARY KEY CLUSTERED
                                                              (
                                                               [uri_request_id] ASC
                                                                  )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[uri_response_health_checks]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[uri_response_health_checks](
                                                                        [uri_response_id] [int] NOT NULL,
                                                                        [health_status] [nchar](1) NOT NULL,
                                                                        [attempt_count_since_last_green] [smallint] NOT NULL,
                                                                        [HTTP_code] [int] NOT NULL,
                                                                        [error_response] [nvarchar](255) NOT NULL,
                                                                        [latest_test_datetime] [nvarchar](45) NOT NULL,
                                                                        CONSTRAINT [PK_uri_response_health_checks] PRIMARY KEY CLUSTERED
                                                                            (
                                                                             [uri_response_id] ASC
                                                                                )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [gs1resolver_dataentry_db].[uri_responses]    Script Date: 03/10/2019 14:08:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [gs1resolver_dataentry_db].[uri_responses](
                                                           [uri_response_id] [int] IDENTITY(1,1) NOT NULL,
                                                           [uri_request_id] [int] NOT NULL,
                                                           [linktype] [nvarchar](100) NOT NULL,
                                                           [iana_language] [nchar](2) NOT NULL,
                                                           [context] [nvarchar](100) NOT NULL,
                                                           [mime_type] [nvarchar](45) NOT NULL,
                                                           [friendly_link_name] [nvarchar](45) NOT NULL,
                                                           [destination_uri] [nvarchar](255) NOT NULL,
                                                           [default_linktype] [bit] NOT NULL,
                                                           [default_iana_language] [bit] NOT NULL,
                                                           [default_context] [bit] NOT NULL,
                                                           [default_mime_type] [bit] NOT NULL,
                                                           [forward_request_querystrings] [bit] NOT NULL,
                                                           [active] [bit] NOT NULL,
                                                           CONSTRAINT [PK_uri_responses_uri_response_id] PRIMARY KEY CLUSTERED
                                                               (
                                                                [uri_response_id] ASC
                                                                   )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[accounts] ON

INSERT [gs1resolver_dataentry_db].[accounts] ([account_id], [member_primary_gln], [firstname], [surname], [login_password], [login_email], [account_notes], [last_login_datetime], [administrator], [active]) VALUES (1, N'7878787878787', N'Sansa', N'Stark', N'6F0E30DCB10808362901D783C65AD092', N'sansa.stark@gs1westeros.com', N'Test Global Account', CAST(N'2019-10-03T12:08:11.0000000' AS DateTime2), N'G', 1)
INSERT [gs1resolver_dataentry_db].[accounts] ([account_id], [member_primary_gln], [firstname], [surname], [login_password], [login_email], [account_notes], [last_login_datetime], [administrator], [active]) VALUES (2, N'4564564564567', N'Sam', N'Tarly', N'6F0E30DCB10808362901D783C65AD092', N'samwell.tarly@castleblack.com', N'Test Ordinary Account', CAST(N'2019-08-01T00:00:00.0000000' AS DateTime2), N'N', 1)
INSERT [gs1resolver_dataentry_db].[accounts] ([account_id], [member_primary_gln], [firstname], [surname], [login_password], [login_email], [account_notes], [last_login_datetime], [administrator], [active]) VALUES (3, N'1234512345876', N'Yara', N'Greyjoy', N'6F0E30DCB10808362901D783C65AD092', N'yara.greyjoy@ironislands.com', N'Test Member Account', CAST(N'2019-08-15T12:47:08.0000000' AS DateTime2), N'M', 1)
INSERT [gs1resolver_dataentry_db].[accounts] ([account_id], [member_primary_gln], [firstname], [surname], [login_password], [login_email], [account_notes], [last_login_datetime], [administrator], [active]) VALUES (4, N'4564564564567', N'Jon', N'Snow', N'6F0E30DCB10808362901D783C65AD092', N'jon.snow@castleblack.com', N'Test Member Account', CAST(N'2019-08-15T12:47:08.0000000' AS DateTime2), N'M', 1)
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[accounts] OFF
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[gcp_resolves] ON

INSERT [gs1resolver_dataentry_db].[gcp_resolves] ([gcp_resolve_id], [member_primary_gln], [gs1_key_code], [gs1_gcp_value], [resolve_url_format], [notes], [api_builder_processed]) VALUES (1, N'9898989898989', N'gtin', N'0505476', N'https://lansley.com/experimental{URI}', N'Example using the {URI} variable which contains the URL received by the GS1 Resolver, starting with ''/'' character', 1)
INSERT [gs1resolver_dataentry_db].[gcp_resolves] ([gcp_resolve_id], [member_primary_gln], [gs1_key_code], [gs1_gcp_value], [resolve_url_format], [notes], [api_builder_processed]) VALUES (2, N'9898989898989', N'gtin', N'05054781', N'https://lansley.com/experimental?dlinfo={DL}', N'Example using {DL} variable which is replaced by A URL-encoded JSON document with all digital link parameters. In this example, a name """dlinfo""" has been used for the end server to read', 1)
INSERT [gs1resolver_dataentry_db].[gcp_resolves] ([gcp_resolve_id], [member_primary_gln], [gs1_key_code], [gs1_gcp_value], [resolve_url_format], [notes], [api_builder_processed]) VALUES (3, N'9898989898989', N'gtin', N'057123', N'https://lansley.com/experimental{URI}?digitallinkdata={DL}', N'Example using both {URI} and {DL} variables. Note how there is a ? before the chosen querystring variable name to avoid syntax errors if other querystrings are present on the inbound request', 1)
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[gcp_resolves] OFF
INSERT [gs1resolver_dataentry_db].[gs1_mos] ([gs1_mo_primary_gln], [organisation_name]) VALUES (N'9898989898989', N'GS1 Westeros')
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[list_contexts] ON

INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (0, N'xx', N'(Not Used)', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (1, N'ac', N'Ascension Island', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (2, N'ad', N'Andorra', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (3, N'ae', N'United Arab Emirates', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (4, N'af', N'Afghanistan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (5, N'ag', N'Antigua and Barbuda', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (6, N'ai', N'Anguilla', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (7, N'al', N'Albania', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (8, N'am', N'Armenia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (9, N'an', N'Netherlands Antilles', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (10, N'ao', N'Angola', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (11, N'aq', N'Antarctica', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (12, N'ar', N'Argentina', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (13, N'as', N'American Samoa', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (14, N'at', N'Austria', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (15, N'au', N'Australia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (16, N'aw', N'Aruba', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (17, N'ax', N'Aland Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (18, N'az', N'Azerbaijan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (19, N'ba', N'Bosnia and Herzegovina', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (20, N'bb', N'Barbados', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (21, N'bd', N'Bangladesh', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (22, N'be', N'Belgium', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (23, N'bf', N'Burkina Faso', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (24, N'bg', N'Bulgaria', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (25, N'bh', N'Bahrain', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (26, N'bi', N'Burundi', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (27, N'bj', N'Benin', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (28, N'bm', N'Bermuda', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (29, N'bn', N'Brunei Darussalam', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (30, N'bo', N'Bolivia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (31, N'br', N'Brazil', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (32, N'bs', N'Bahamas', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (33, N'bt', N'Bhutan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (34, N'bv', N'Bouvet Island', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (35, N'bw', N'Botswana', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (36, N'by', N'Belarus', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (37, N'bz', N'Belize', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (38, N'ca', N'Canada', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (39, N'cc', N'Cocos (Keeling) Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (40, N'cd', N'Congo, The Democratic Republic of the', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (41, N'cf', N'Central African Republic', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (42, N'cg', N'Congo, Republic of', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (43, N'ch', N'Switzerland', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (44, N'ci', N'Cote d^Ivoire', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (45, N'ck', N'Cook Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (46, N'cl', N'Chile', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (47, N'cm', N'Cameroon', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (48, N'cn', N'China', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (49, N'co', N'Colombia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (50, N'cr', N'Costa Rica', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (51, N'cu', N'Cuba', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (52, N'cv', N'Cape Verde', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (53, N'cx', N'Christmas Island', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (54, N'cy', N'Cyprus', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (55, N'cz', N'Czech Republic', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (56, N'de', N'Germany', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (57, N'dj', N'Djibouti', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (58, N'dk', N'Denmark', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (59, N'dm', N'Dominica', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (60, N'do', N'Dominican Republic', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (61, N'dz', N'Algeria', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (62, N'ec', N'Ecuador', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (63, N'ee', N'Estonia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (64, N'eg', N'Egypt', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (65, N'eh', N'Western Sahara', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (66, N'er', N'Eritrea', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (67, N'es', N'Spain', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (68, N'et', N'Ethiopia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (69, N'eu', N'European Union', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (70, N'fi', N'Finland', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (71, N'fj', N'Fiji', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (72, N'fk', N'Falkland Islands (Malvinas)', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (73, N'fm', N'Micronesia, Federated States of', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (74, N'fo', N'Faroe Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (75, N'fr', N'France', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (76, N'ga', N'Gabon', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (77, N'gb', N'United Kingdom', 1)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (78, N'gd', N'Grenada', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (79, N'ge', N'Georgia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (80, N'gf', N'French Guiana', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (81, N'gg', N'Guernsey', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (82, N'gh', N'Ghana', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (83, N'gi', N'Gibraltar', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (84, N'gl', N'Greenland', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (85, N'gm', N'Gambia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (86, N'gn', N'Guinea', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (87, N'gp', N'Guadeloupe', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (88, N'gq', N'Equatorial Guinea', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (89, N'gr', N'Greece', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (90, N'gs', N'South Georgia and the South Sandwich Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (91, N'gt', N'Guatemala', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (92, N'gu', N'Guam', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (93, N'gw', N'Guinea-Bissau', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (94, N'gy', N'Guyana', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (95, N'hk', N'Hong Kong', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (96, N'hm', N'Heard and McDonald Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (97, N'hn', N'Honduras', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (98, N'hr', N'Croatia/Hrvatska', 0)
GO
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (99, N'ht', N'Haiti', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (100, N'hu', N'Hungary', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (101, N'id', N'Indonesia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (102, N'ie', N'Ireland', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (103, N'il', N'Israel', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (104, N'im', N'Isle of Man', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (105, N'in', N'India', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (106, N'io', N'British Indian Ocean Territory', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (107, N'iq', N'Iraq', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (108, N'ir', N'Iran, Islamic Republic of', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (109, N'is', N'Iceland', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (110, N'it', N'Italy', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (111, N'je', N'Jersey', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (112, N'jm', N'Jamaica', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (113, N'jo', N'Jordan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (114, N'jp', N'Japan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (115, N'ke', N'Kenya', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (116, N'kg', N'Kyrgyzstan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (117, N'kh', N'Cambodia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (118, N'ki', N'Kiribati', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (119, N'km', N'Comoros', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (120, N'kn', N'Saint Kitts and Nevis', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (121, N'kp', N'Korea, Democratic People^s Republic', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (122, N'kr', N'Korea, Republic of', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (123, N'kw', N'Kuwait', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (124, N'ky', N'Cayman Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (125, N'kz', N'Kazakhstan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (126, N'la', N'Lao People^s Democratic Republic', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (127, N'lb', N'Lebanon', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (128, N'lc', N'Saint Lucia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (129, N'li', N'Liechtenstein', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (130, N'lk', N'Sri Lanka', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (131, N'lr', N'Liberia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (132, N'ls', N'Lesotho', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (133, N'lt', N'Lithuania', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (134, N'lu', N'Luxembourg', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (135, N'lv', N'Latvia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (136, N'ly', N'Libyan Arab Jamahiriya', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (137, N'ma', N'Morocco', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (138, N'mc', N'Monaco', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (139, N'md', N'Moldova, Republic of', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (140, N'me', N'Montenegro', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (141, N'mg', N'Madagascar', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (142, N'mh', N'Marshall Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (143, N'mk', N'Macedonia, The Former Yugoslav Republic of', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (144, N'ml', N'Mali', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (145, N'mm', N'Myanmar', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (146, N'mn', N'Mongolia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (147, N'mo', N'Macao', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (148, N'mp', N'Northern Mariana Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (149, N'mq', N'Martinique', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (150, N'mr', N'Mauritania', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (151, N'ms', N'Montserrat', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (152, N'mt', N'Malta', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (153, N'mu', N'Mauritius', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (154, N'mv', N'Maldives', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (155, N'mw', N'Malawi', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (156, N'mx', N'Mexico', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (157, N'my', N'Malaysia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (158, N'mz', N'Mozambique', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (159, N'na', N'Namibia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (160, N'nc', N'New Caledonia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (161, N'ne', N'Niger', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (162, N'nf', N'Norfolk Island', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (163, N'ng', N'Nigeria', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (164, N'ni', N'Nicaragua', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (165, N'nl', N'Netherlands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (166, N'no', N'Norway', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (167, N'np', N'Nepal', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (168, N'nr', N'Nauru', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (169, N'nu', N'Niue', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (170, N'nz', N'New Zealand', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (171, N'om', N'Oman', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (172, N'pa', N'Panama', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (173, N'pe', N'Peru', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (174, N'pf', N'French Polynesia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (175, N'pg', N'Papua New Guinea', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (176, N'ph', N'Philippines', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (177, N'pk', N'Pakistan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (178, N'pl', N'Poland', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (179, N'pm', N'Saint Pierre and Miquelon', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (180, N'pn', N'Pitcairn Island', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (181, N'pr', N'Puerto Rico', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (182, N'ps', N'Palestinian Territory, Occupied', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (183, N'pt', N'Portugal', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (184, N'pw', N'Palau', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (185, N'py', N'Paraguay', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (186, N'qa', N'Qatar', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (187, N're', N'Reunion Island', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (188, N'ro', N'Romania', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (189, N'rs', N'Serbia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (190, N'ru', N'Russian Federation', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (191, N'rw', N'Rwanda', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (192, N'sa', N'Saudi Arabia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (193, N'sb', N'Solomon Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (194, N'sc', N'Seychelles', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (195, N'sd', N'Sudan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (196, N'se', N'Sweden', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (197, N'sg', N'Singapore', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (198, N'sh', N'Saint Helena', 0)
GO
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (199, N'si', N'Slovenia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (200, N'sj', N'Svalbard and Jan Mayen Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (201, N'sk', N'Slovak Republic', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (202, N'sl', N'Sierra Leone', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (203, N'sm', N'San Marino', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (204, N'sn', N'Senegal', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (205, N'so', N'Somalia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (206, N'sr', N'Suriname', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (207, N'st', N'Sao Tome and Principe', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (208, N'su', N'Soviet Union (being phased out)', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (209, N'sv', N'El Salvador', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (210, N'sy', N'Syrian Arab Republic', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (211, N'sz', N'Swaziland', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (212, N'tc', N'Turks and Caicos Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (213, N'td', N'Chad', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (214, N'tf', N'French Southern Territories', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (215, N'tg', N'Togo', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (216, N'th', N'Thailand', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (217, N'tj', N'Tajikistan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (218, N'tk', N'Tokelau', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (219, N'tl', N'Timor-Leste', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (220, N'tm', N'Turkmenistan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (221, N'tn', N'Tunisia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (222, N'to', N'Tonga', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (223, N'tp', N'East Timor', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (224, N'tr', N'Turkey', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (225, N'tt', N'Trinidad and Tobago', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (226, N'tv', N'Tuvalu', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (227, N'tw', N'Taiwan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (228, N'tz', N'Tanzania', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (229, N'ua', N'Ukraine', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (230, N'ug', N'Uganda', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (231, N'uk', N'United Kingdom', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (232, N'um', N'United States Minor Outlying Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (233, N'us', N'United States', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (234, N'uy', N'Uruguay', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (235, N'uz', N'Uzbekistan', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (236, N'va', N'Holy See (Vatican City State)', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (237, N'vc', N'Saint Vincent and the Grenadines', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (238, N've', N'Venezuela', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (239, N'vg', N'Virgin Islands, British', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (240, N'vi', N'Virgin Islands, U.S.', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (241, N'vn', N'Vietnam', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (242, N'vu', N'Vanuatu', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (243, N'wf', N'Wallis and Futuna Islands', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (244, N'ws', N'Samoa', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (245, N'ye', N'Yemen', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (246, N'yt', N'Mayotte', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (247, N'yu', N'Yugoslavia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (248, N'za', N'South Africa', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (249, N'zm', N'Zambia', 0)
INSERT [gs1resolver_dataentry_db].[list_contexts] ([context_id], [context_value], [description], [default_context_flag]) VALUES (250, N'zw', N'Zimbabwe', 0)
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[list_contexts] OFF
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[list_gs1_key_components] ON

INSERT [gs1resolver_dataentry_db].[list_gs1_key_components] ([gs1_key_component_id], [gs1_key_code], [component_order], [component_uri_id], [component_name], [accepted_formats]) VALUES (1, N'gtin', 1, N'cpv', N'Consumer Product Variant', N'1*20XCHAR')
INSERT [gs1resolver_dataentry_db].[list_gs1_key_components] ([gs1_key_component_id], [gs1_key_code], [component_order], [component_uri_id], [component_name], [accepted_formats]) VALUES (2, N'gtin', 2, N'lot', N'Batch or Lot identifier', N'1*20XCHAR')
INSERT [gs1resolver_dataentry_db].[list_gs1_key_components] ([gs1_key_component_id], [gs1_key_code], [component_order], [component_uri_id], [component_name], [accepted_formats]) VALUES (3, N'gtin', 3, N'ser', N'GTIN Serial Number', N'1*20XCHAR')
INSERT [gs1resolver_dataentry_db].[list_gs1_key_components] ([gs1_key_component_id], [gs1_key_code], [component_order], [component_uri_id], [component_name], [accepted_formats]) VALUES (4, N'itip', 1, N'cpv', N'Consumer Product Variant', N'1*20XCHAR')
INSERT [gs1resolver_dataentry_db].[list_gs1_key_components] ([gs1_key_component_id], [gs1_key_code], [component_order], [component_uri_id], [component_name], [accepted_formats]) VALUES (5, N'itip', 2, N'lot', N'Batch or Lot identifier', N'1*20XCHAR')
INSERT [gs1resolver_dataentry_db].[list_gs1_key_components] ([gs1_key_component_id], [gs1_key_code], [component_order], [component_uri_id], [component_name], [accepted_formats]) VALUES (6, N'itip', 3, N'ser', N'GTIN Serial Number', N'1*20XCHAR')
INSERT [gs1resolver_dataentry_db].[list_gs1_key_components] ([gs1_key_component_id], [gs1_key_code], [component_order], [component_uri_id], [component_name], [accepted_formats]) VALUES (7, N'cpid', 1, N'cpsn', N'CPID Serial Number!', N'1*12DIGIT')
INSERT [gs1resolver_dataentry_db].[list_gs1_key_components] ([gs1_key_component_id], [gs1_key_code], [component_order], [component_uri_id], [component_name], [accepted_formats]) VALUES (8, N'gln', 1, N'glnx', N'GLNX NUmber', N'1*20XCHAR')
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[list_gs1_key_components] OFF
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[list_linktypes] ON

INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (1, N'en-GB', N'Traceability information', N'https://gs1.org/voc/traceability', N'gtin', N'A link to traceability information about the product.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (2, N'en-GB', N'Recipe website', N'https://gs1.org/voc/recipeInfo', N'gtin', N'A link to a recipe website for the product.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (3, N'en-GB', N'Promotion', N'https://gs1.org/voc/promotion', N'gtin', N'A link to a promotion for the product.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (4, N'en-GB', N'Ingredients information', N'https://gs1.org/voc/ingredientsInfo', N'gtin', N'A document providing facts about the product''s ingredients.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (5, N'en-GB', N'Consumer handling and storage information', N'https://gs1.org/voc/consumerHandlingStorageInfo', N'gtin', N'A link to information about safe handling and storage of the product.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (6, N'en-GB', N'EPCIS repository', N'https://gs1.org/voc/epcis', N'gtin', N'A link to an EPCIS repository of visibility event data.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (7, N'en-GB', N'Master data', N'https://gs1.org/voc/masterData', N'gtin', N'A link to a source of structured master data for the entity. This is typically for B2B applications, rather than for consumers, and likely to be subject to access control.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (8, N'en-GB', N'Verification Service', N'https://gs1.org/voc/verificationService', N'gtin', N'A link to a service for verifying the status of a product and its identifier.  This value of linkType is used with implementations of the GS1 Lightweight Verification Messaging Standard.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (9, N'en-GB', N'Register purchase', N'https://gs1.org/voc/registerProduct', N'gtin', N'A link to an entry point for registering ownership of a product including for warranty purposes.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (10, N'en-GB', N'Certification information', N'https://gs1.org/voc/certificationInfo', N'gtin', N'A link to certification information about the product.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (11, N'en-GB', N'Summary product characteristics (SmPC)', N'https://gs1.org/voc/smpc', N'gtin', N'Link to Summary Product Characteristics for healthcare professionals.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (12, N'en-GB', N'SmartLabel', N'https://gs1.org/voc/smartLabel', N'gtin', N'A link to the product''s SmartLabel page.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (13, N'en-GB', N'Service information', N'https://gs1.org/voc/serviceInfo', N'gtin', N'A document that provides service or maintenance instructions for the item.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (14, N'en-GB', N'Safety information', N'https://gs1.org/voc/safetyInfo', N'gtin', N'A document, video or graphic that provides safety information about the item')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (15, N'en-GB', N'FAQs', N'https://gs1.org/voc/faqs', N'gtin', N'A link to a set of frequently asked questions.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (16, N'en-GB', N'Retailers', N'https://gs1.org/voc/hasRetailers', N'gtin', N'A link to a list of retailers for this item')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (17, N'en-GB', N'Purchase supplies or accessories', N'https://gs1.org/voc/purchaseSuppliesOrAccessories', N'gtin', N'A link to a page where supplies or accessories for the item can be purchased or ordered.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (18, N'en-GB', N'More information for professionals about this bran', N'https://gs1.org/voc/brandHomepageClinical', N'gtin', N'Link to brand presence aimed at clinical professionals.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (19, N'en-GB', N'Tutorial', N'https://gs1.org/voc/tutorial', N'gtin', N'A link to a tutorial or set of tutorials, such as online classes, how-to videos etc.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (20, N'en-GB', N'Handled by', N'https://gs1.org/voc/handledBy', N'gtin', N'Used when one resolver redirects all request URIs that match a given pattern without further processing, such as from GS1 to a brand-operated service')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (21, N'en-GB', N'Support', N'https://gs1.org/voc/support', N'gtin', N'A link to a source of support such as a helpdesk, chat support, email etc.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (22, N'en-GB', N'Product information page', N'https://gs1.org/voc/pip', N'gtin', N'A document that provides information about the identified item, typically operated by the brand owner or a retailer of the product. It may include links to further information, product description, specifications etc. N.B. The page may be human or machine readable, or a combination of the two (such as an HTML page with embedded structured data).')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (23, N'en-GB', N'Instructions', N'https://gs1.org/voc/instructions', N'gtin', N'A document, video or graphic that provides instructions related to the item, including assembly instructions, usage tips etc.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (24, N'en-GB', N'More information for patients about this brand', N'https://gs1.org/voc/brandHomepagePatient', N'gtin', N'Link to a brand presence aimed at patients.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (25, N'en-GB', N'Patient information', N'https://gs1.org/voc/epil', N'gtin', N'Link to an electronic patient information leaflet.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (26, N'en-GB', N'Social media', N'https://gs1.org/voc/socialMedia', N'gtin', N'A link to a social media channel. The title will typically be replaced by the name of the channel.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (27, N'en-GB', N'Recall status', N'https://gs1.org/voc/recallStatus', N'gtin', N'A link to information about whether the product has been recalled or not, typically an API.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (28, N'en-GB', N'Activity ideas', N'https://gs1.org/voc/activityIdeas', N'gtin', N'Ideas for using the product, particularly with children.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (29, N'en-GB', N'Review', N'https://gs1.org/voc/review', N'gtin', N'A link to one or more reviews of the product or service.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (30, N'en-GB', N'Quick start guide', N'https://gs1.org/voc/quickStartGuide', N'gtin', N'A document, video or graphic that shows the key features needed to be understood to begin using the item.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (31, N'en-GB', N'sustainability and recycling', N'https://gs1.org/voc/productSustainabilityInfo', N'gtin', N'Information about the productís sustainability of manufacture, recycling information etc.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (32, N'en-GB', N'Nutritional information', N'https://gs1.org/voc/nutritionalInfo', N'gtin', N'A document providing nutritional facts about the product.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (33, N'en-GB', N'What''s in the box', N'https://gs1.org/voc/whatsInTheBox', N'gtin', N'A document describing all the individual items in a packaged item.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (34, N'en-GB', N'Leave a review', N'https://gs1.org/voc/leaveReview', N'gtin', N'A link through which a review can be added.')
INSERT [gs1resolver_dataentry_db].[list_linktypes] ([linktype_id], [locale], [linktype_name], [linktype_reference_url], [applicable_gs1_key_code], [description]) VALUES (35, N'en-GB', N'Allergen information', N'https://gs1.org/voc/allergenInfo', N'gtin', N'A document describing the allergens in the product.')
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[list_linktypes] OFF
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[list_mime_types] ON

INSERT [gs1resolver_dataentry_db].[list_mime_types] ([mime_type_id], [mime_type_value], [description], [default_mime_type_flag]) VALUES (1, N'text/html', N'HTML web page', 1)
INSERT [gs1resolver_dataentry_db].[list_mime_types] ([mime_type_id], [mime_type_value], [description], [default_mime_type_flag]) VALUES (2, N'text/csv', N'CSV data file', 0)
INSERT [gs1resolver_dataentry_db].[list_mime_types] ([mime_type_id], [mime_type_value], [description], [default_mime_type_flag]) VALUES (3, N'text/tab-separated-values', N'Tab-separated values data file', 0)
INSERT [gs1resolver_dataentry_db].[list_mime_types] ([mime_type_id], [mime_type_value], [description], [default_mime_type_flag]) VALUES (4, N'text/xml', N'XML data file', 0)
INSERT [gs1resolver_dataentry_db].[list_mime_types] ([mime_type_id], [mime_type_value], [description], [default_mime_type_flag]) VALUES (5, N'text/plain', N'Text file', 0)
INSERT [gs1resolver_dataentry_db].[list_mime_types] ([mime_type_id], [mime_type_value], [description], [default_mime_type_flag]) VALUES (6, N'application/json', N'JSON data source', 0)
INSERT [gs1resolver_dataentry_db].[list_mime_types] ([mime_type_id], [mime_type_value], [description], [default_mime_type_flag]) VALUES (7, N'application/vnd.ms-excel', N'Microsoft Excel', 0)
INSERT [gs1resolver_dataentry_db].[list_mime_types] ([mime_type_id], [mime_type_value], [description], [default_mime_type_flag]) VALUES (8, N'vnd.ms-powerpoint', N'Microsoft PowerPoint presentation', 0)
INSERT [gs1resolver_dataentry_db].[list_mime_types] ([mime_type_id], [mime_type_value], [description], [default_mime_type_flag]) VALUES (9, N'application/pdf', N'PDF document', 0)
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[list_mime_types] OFF
INSERT [gs1resolver_dataentry_db].[members] ([member_primary_gln], [gs1_mo_primary_gln], [member_name], [notes], [active], [member_logo_url]) VALUES (N'1234512345876', N'9898989898989', N'Iron Islands Tools And Axes Ltd', N'Test member', 1, N'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWwAAADICAYAAADMZdv1AAADd2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6eG1wUmlnaHRzPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvcmlnaHRzLyIKICAgeG1wUmlnaHRzOk1hcmtlZD0iVHJ1ZSIKICAgeG1wUmlnaHRzOldlYlN0YXRlbWVudD0ibWFpbHRpOm5pY2tAbGFuc2xleS5jb20iPgogICA8ZGM6Y3JlYXRvcj4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGk+TmljayBMYW5zbGV5PC9yZGY6bGk+CiAgICA8L3JkZjpTZXE+CiAgIDwvZGM6Y3JlYXRvcj4KICAgPGRjOnRpdGxlPgogICAgPHJkZjpBbHQ+CiAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5Jcm9uIElzbGFuZHMgVG9vbHMgQW5kIEF4ZXMgTHRkPC9yZGY6bGk+CiAgICA8L3JkZjpBbHQ+CiAgIDwvZGM6dGl0bGU+CiAgIDxkYzpyaWdodHM+CiAgICA8cmRmOkFsdD4KICAgICA8cmRmOmxpIHhtbDpsYW5nPSJ4LWRlZmF1bHQiPk5pY2sgTGFuc2xleSYjeEE7PC9yZGY6bGk+CiAgICA8L3JkZjpBbHQ+CiAgIDwvZGM6cmlnaHRzPgogIDwvcmRmOkRlc2NyaXB0aW9uPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KPD94cGFja2V0IGVuZD0iciI/PmUuG8IAACAASURBVHic7X0JmBXFufY3MOz7DsO+o4AsiqASNO64XrckV41r8icxJm73Jib6R6MxVxM1GvVqNolbNO6AgAgIKJsoAoLszADDJjDs+wBzn7eZmqmuU9Vd1es5M/U+NHNOn+7q6uqut7766lvyysrKiomoAxHtJgsLCwuLbERjIlqfX/6BuL8WFhYWFtmHxvn2oVhYRIeDBw/S+vXr6ejRo9ShQwdq0KCBbV2LyGAJ28IiIhQWFtI//vEP+uSTTxzi7t69O51//vl04YUXUkFBgW1mi9CADnuXVYdYWITDli1b6I477qA33njDVU6NGjVo4MCBNHLkSDr33HOdz02bNrWtbREEuy1hW1hEgAceeIAeeughz4KgHunfvz+dddZZdOWVV9KQIUNs01uYwBK2hUVYTJo0ia6++mravVvf0KpJkyb03e9+l+655x7q1auXfQYWOrCEbWERBl9//TV95zvfoSVLlgQqpXPnzvTkk086EreFhQ9217AtZGERDBMnTqQrrrgiMFkDa9eupe9///v02muv2adg4QsrYVvkJGCR8cUXX9D27dupXbt2dOqppzp/k8DGjRvpkUceob/+9a905MiRSK7Ytm1bGjduHA0ePNi+kBYq7LZmfRY5B1hiPPbYY7RgwQKn6nl5edS7d2+66aab6Pbbb4/V9nnWrFl066230rJlyyItd/PmzfTSSy9ZwrbwhJWwLWIHFuO2bdvmLLS1aNEi1OVmzJjhLNZBypUBNs8gvtatW0d+W0uXLqVLL72UVq9eHXnZAEz+pk6das3+LFSwOmyL+LBnzx56/vnn6aqrrqKLLrqILr74Ysf8bdOmTYGvOXr0aCVZAx9++KEjaR84cCDy+/rb3/4WG1kD8JD85ptvYivfIvdhVSIWsaCkpIR+/vOf07/+9S9X8Z999hl99NFHjhQcxJxt0aJFvsdMmDCBHnzwQUdtEhUw+Hz66aexviylpaXOFgdgzQIdOQa7bt260QUXXOCokSxyDFCJlFlYRIgDBw6UXXfddWV4vVTbxRdfXFZaWmp00SNHjpSdeeaZnuWyrW7dumWzZs2K7KbWrVtX1qlTJ61rB91atmxZtnz58shfxc8//zyj3YYMGVI2duzYyK9lESt2WZWIReT4zW9+42um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')
INSERT [gs1resolver_dataentry_db].[members] ([member_primary_gln], [gs1_mo_primary_gln], [member_name], [notes], [active], [member_logo_url]) VALUES (N'4564564564567', N'9898989898989', N'Castle Black Security', N'(Test Member)', 1, N'data:image/png;base64,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')
INSERT [gs1resolver_dataentry_db].[members] ([member_primary_gln], [gs1_mo_primary_gln], [member_name], [notes], [active], [member_logo_url]) VALUES (N'7878787878787', N'9898989898989', N'GS1 Westeros Ltd', N'(Test Member)', 1, N'data:image/png;base64,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')
INSERT [gs1resolver_dataentry_db].[sessions] ([session_id], [account_id], [datetime_created], [member_primary_gln]) VALUES (N'w8d5yzphpqkaa286uqs6j2hg1e6j61ywbg8gt4pna84bu52h0v', 1, CAST(N'2019-10-03T12:48:47.0000000' AS DateTime2), N'7878787878787')
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[uri_requests] ON

INSERT [gs1resolver_dataentry_db].[uri_requests] ([uri_request_id], [member_primary_gln], [gs1_key_code], [gs1_key_value], [item_description], [date_inserted], [date_last_updated], [web_uri_prefix_1], [web_uri_suffix_1], [web_uri_prefix_2], [web_uri_suffix_2], [web_uri_prefix_3], [web_uri_suffix_3], [web_uri_prefix_4], [web_uri_suffix_4], [include_in_sitemap], [active], [api_builder_processed], [flagged_for_deletion]) VALUES (1, N'7878787878787', N'gtin', N'07625695556149', N'[]R1MxIEdsb2JhbCBPZmZpY2U=', CAST(N'2019-07-26T12:09:45.0000000' AS DateTime2), CAST(N'2019-09-04T13:46:08.0000000' AS DateTime2), N'', N'', N'', N'', N'', N'', N'', N'', 0, 1, 0, 0)
INSERT [gs1resolver_dataentry_db].[uri_requests] ([uri_request_id], [member_primary_gln], [gs1_key_code], [gs1_key_value], [item_description], [date_inserted], [date_last_updated], [web_uri_prefix_1], [web_uri_suffix_1], [web_uri_prefix_2], [web_uri_suffix_2], [web_uri_prefix_3], [web_uri_suffix_3], [web_uri_prefix_4], [web_uri_suffix_4], [include_in_sitemap], [active], [api_builder_processed], [flagged_for_deletion]) VALUES (2, N'1234512345876', N'gtin', N'5017353502285', N'[]SXJvbiBBeGU=', CAST(N'2019-08-15T12:31:57.0000000' AS DateTime2), CAST(N'2019-08-15T13:09:49.0000000' AS DateTime2), N'', N'', N'', N'', N'', N'', N'', N'', 1, 0, 0, 0)
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[uri_requests] OFF
INSERT [gs1resolver_dataentry_db].[uri_response_health_checks] ([uri_response_id], [health_status], [attempt_count_since_last_green], [HTTP_code], [error_response], [latest_test_datetime]) VALUES (1, N'G', 0, 200, N'OK - 0', N'Sep 20 2019  7:48AM')
INSERT [gs1resolver_dataentry_db].[uri_response_health_checks] ([uri_response_id], [health_status], [attempt_count_since_last_green], [HTTP_code], [error_response], [latest_test_datetime]) VALUES (2, N'G', 0, 200, N'OK - 0', N'Sep 20 2019  7:48AM')
INSERT [gs1resolver_dataentry_db].[uri_response_health_checks] ([uri_response_id], [health_status], [attempt_count_since_last_green], [HTTP_code], [error_response], [latest_test_datetime]) VALUES (3, N'G', 0, 200, N'OK - 0', N'Sep 20 2019  7:48AM')
INSERT [gs1resolver_dataentry_db].[uri_response_health_checks] ([uri_response_id], [health_status], [attempt_count_since_last_green], [HTTP_code], [error_response], [latest_test_datetime]) VALUES (44767777, N'G', 0, 200, N'OK - 0', N'Sep 20 2019  7:48AM')
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[uri_responses] ON

INSERT [gs1resolver_dataentry_db].[uri_responses] ([uri_response_id], [uri_request_id], [linktype], [iana_language], [context], [mime_type], [friendly_link_name], [destination_uri], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active]) VALUES (1, 1, N'https://gs1.org/voc/pip', N'en', N'gb', N'text/html', N'[]RGVzY3JpcHRpb24gKEdTMSBHTyBIb21lIFBhZ2Up', N'https://www.gs1.org', 1, 0, 0, 0, 1, 1)
INSERT [gs1resolver_dataentry_db].[uri_responses] ([uri_response_id], [uri_request_id], [linktype], [iana_language], [context], [mime_type], [friendly_link_name], [destination_uri], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active]) VALUES (2, 1, N'https://gs1.org/voc/epil', N'en', N'fr', N'application/pdf', N'[]R1MxIEdsb2JhbCBPZmZpY2UgRkFR', N'https://www.gs1.org/docs/media_centre/gs1_pr_060614_epcis_cbv_FAQ.pdf', 1, 0, 1, 1, 1, 1)
INSERT [gs1resolver_dataentry_db].[uri_responses] ([uri_response_id], [uri_request_id], [linktype], [iana_language], [context], [mime_type], [friendly_link_name], [destination_uri], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active]) VALUES (3, 2, N'https://gs1.org/voc/pip', N'en', N'gb', N'text/html', N'[]', N'https://awoiaf.westeros.org/index.php/Iron_Islands', 1, 1, 1, 1, 1, 0)
INSERT [gs1resolver_dataentry_db].[uri_responses] ([uri_response_id], [uri_request_id], [linktype], [iana_language], [context], [mime_type], [friendly_link_name], [destination_uri], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active]) VALUES (44767777, 1, N'https://gs1.org/voc/pip', N'en', N'gb', N'application/json', N'[]', N'https://lansley.com', 1, 1, 1, 1, 1, 1)
SET IDENTITY_INSERT [gs1resolver_dataentry_db].[uri_responses] OFF
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_gcp_resolves]    Script Date: 03/10/2019 14:08:27 ******/
CREATE UNIQUE NONCLUSTERED INDEX [IX_gcp_resolves] ON [gs1resolver_dataentry_db].[gcp_resolves]
    (
     [gs1_key_code] ASC,
     [gs1_gcp_value] ASC
        )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_list_contexts_value]    Script Date: 03/10/2019 14:08:27 ******/
CREATE NONCLUSTERED INDEX [IX_list_contexts_value] ON [gs1resolver_dataentry_db].[list_contexts]
    (
     [context_value] ASC
        )WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [member_primary_gln]    Script Date: 03/10/2019 14:08:27 ******/
CREATE NONCLUSTERED INDEX [member_primary_gln] ON [gs1resolver_dataentry_db].[uri_requests]
    (
     [member_primary_gln] ASC
        )WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF) ON [PRIMARY]
GO
/****** Object:  Index [uri_request_id_idx]    Script Date: 03/10/2019 14:08:27 ******/
CREATE NONCLUSTERED INDEX [uri_request_id_idx] ON [gs1resolver_dataentry_db].[uri_responses]
    (
     [uri_request_id] ASC
        )WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF) ON [PRIMARY]
GO
ALTER TABLE [gs1resolver_dataentry_db].[accounts] ADD  DEFAULT (NULL) FOR [firstname]
GO
ALTER TABLE [gs1resolver_dataentry_db].[accounts] ADD  DEFAULT (NULL) FOR [surname]
GO
ALTER TABLE [gs1resolver_dataentry_db].[accounts] ADD  DEFAULT (NULL) FOR [account_notes]
GO
ALTER TABLE [gs1resolver_dataentry_db].[accounts] ADD  DEFAULT (NULL) FOR [last_login_datetime]
GO
ALTER TABLE [gs1resolver_dataentry_db].[accounts] ADD  DEFAULT (N'N') FOR [administrator]
GO
ALTER TABLE [gs1resolver_dataentry_db].[accounts] ADD  DEFAULT ((1)) FOR [active]
GO
ALTER TABLE [gs1resolver_dataentry_db].[audit_log] ADD  CONSTRAINT [DF_audit_log_entryDateTime]  DEFAULT (getdate()) FOR [logTimestamp]
GO
ALTER TABLE [gs1resolver_dataentry_db].[gcp_resolves] ADD  CONSTRAINT [DF_gcp_resolves_api_builder_processed]  DEFAULT ((0)) FOR [api_builder_processed]
GO
ALTER TABLE [gs1resolver_dataentry_db].[gs1_mos] ADD  CONSTRAINT [DF__gs1_mos__organis__30EE274C]  DEFAULT (NULL) FOR [organisation_name]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_contexts] ADD  CONSTRAINT [DF_list_contexts_default_context]  DEFAULT ((0)) FOR [default_context_flag]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_gs1_key_components] ADD  DEFAULT (NULL) FOR [component_uri_id]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_gs1_key_components] ADD  DEFAULT (NULL) FOR [component_name]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_gs1_key_components] ADD  DEFAULT (NULL) FOR [accepted_formats]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_linktypes] ADD  CONSTRAINT [DF__list_link__linkt__3B36AB95]  DEFAULT (NULL) FOR [linktype_reference_url]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_linktypes] ADD  CONSTRAINT [DF__list_link__appli__3C2ACFCE]  DEFAULT (NULL) FOR [applicable_gs1_key_code]
GO
ALTER TABLE [gs1resolver_dataentry_db].[list_mime_types] ADD  CONSTRAINT [DF_list_mime_types_default_mime_type_flag]  DEFAULT ((0)) FOR [default_mime_type_flag]
GO
ALTER TABLE [gs1resolver_dataentry_db].[members] ADD  CONSTRAINT [DF__members__gs1_mo___1EA48E88]  DEFAULT (NULL) FOR [gs1_mo_primary_gln]
GO
ALTER TABLE [gs1resolver_dataentry_db].[members] ADD  CONSTRAINT [DF__members__member___1F98B2C1]  DEFAULT (NULL) FOR [member_name]
GO
ALTER TABLE [gs1resolver_dataentry_db].[members] ADD  CONSTRAINT [DF__members__notes__208CD6FA]  DEFAULT (NULL) FOR [notes]
GO
ALTER TABLE [gs1resolver_dataentry_db].[members] ADD  CONSTRAINT [DF__members__active__2180FB33]  DEFAULT ((1)) FOR [active]
GO
ALTER TABLE [gs1resolver_dataentry_db].[sessions] ADD  DEFAULT (getdate()) FOR [datetime_created]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__membe__236943A5]  DEFAULT ('') FOR [member_primary_gln]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__gs1_k__245D67DE]  DEFAULT ('') FOR [gs1_key_code]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__gs1_k__25518C17]  DEFAULT ('') FOR [gs1_key_value]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__item___2645B050]  DEFAULT ('NEW') FOR [item_description]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__date___2739D489]  DEFAULT (getdate()) FOR [date_inserted]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__date___282DF8C2]  DEFAULT (getdate()) FOR [date_last_updated]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__web_u__2A164134]  DEFAULT ('') FOR [web_uri_prefix_1]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__web_u__2B0A656D]  DEFAULT ('') FOR [web_uri_suffix_1]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__web_u__2BFE89A6]  DEFAULT ('') FOR [web_uri_prefix_2]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__web_u__2CF2ADDF]  DEFAULT ('') FOR [web_uri_suffix_2]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__web_u__2DE6D218]  DEFAULT ('') FOR [web_uri_prefix_3]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__web_u__2EDAF651]  DEFAULT ('') FOR [web_uri_suffix_3]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__web_u__2FCF1A8A]  DEFAULT ('') FOR [web_uri_prefix_4]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__web_u__30C33EC3]  DEFAULT ('') FOR [web_uri_suffix_4]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__inclu__31B762FC]  DEFAULT ((1)) FOR [include_in_sitemap]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__activ__29221CFB]  DEFAULT ((1)) FOR [active]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF__uri_reque__api_b__32AB8735]  DEFAULT ((0)) FOR [api_builder_processed]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_requests] ADD  CONSTRAINT [DF_uri_requests_flagged_for_deletion]  DEFAULT ((0)) FOR [flagged_for_deletion]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_response_health_checks] ADD  CONSTRAINT [DF__uri_respo__uri_r__530E3526]  DEFAULT (NULL) FOR [uri_response_id]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_response_health_checks] ADD  CONSTRAINT [DF__uri_respo__healt__5402595F]  DEFAULT (NULL) FOR [health_status]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_response_health_checks] ADD  CONSTRAINT [DF__uri_respo__attem__54F67D98]  DEFAULT (NULL) FOR [attempt_count_since_last_green]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_response_health_checks] ADD  CONSTRAINT [DF__uri_respo__lates__55EAA1D1]  DEFAULT (NULL) FOR [latest_test_datetime]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__attri__3A4CA8FD]  DEFAULT ('') FOR [linktype]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__iana___3864608B]  DEFAULT ('') FOR [iana_language]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_context]  DEFAULT ('') FOR [context]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__desti__40F9A68C]  DEFAULT (N'text/html') FOR [mime_type]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__alt_a__3D2915A8]  DEFAULT ('') FOR [friendly_link_name]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__desti__3B40CD36]  DEFAULT ('') FOR [destination_uri]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_default_linktype]  DEFAULT ((0)) FOR [default_linktype]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_default_iana_language]  DEFAULT ((0)) FOR [default_iana_language]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_default_context]  DEFAULT ((0)) FOR [default_context]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_default_mime_type]  DEFAULT ((0)) FOR [default_mime_type]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__forwa__41EDCAC5]  DEFAULT ((0)) FOR [forward_request_querystrings]
GO
ALTER TABLE [gs1resolver_dataentry_db].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__activ__3E1D39E1]  DEFAULT ((0)) FOR [active]
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[account_login]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[account_login]
    @var_email nvarchar(100),
    @var_password nvarchar(100)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

/*
*   SSMA warning messages:
*   M2SS0028: Input value '(not logged in)' can not be converted to DATETIME format
*   M2SS0054: Character set utf8mb4 is ignored during value conversion

*   SSMA informational messages:
*   M2SS0053: string value is converted to binary value based on latin1 character set
*/

    SELECT
        a.member_primary_gln,
        a.account_id,
        a.firstname,
        a.surname,
        a.administrator,
        coalesce(a.last_login_datetime, NULL) AS last_login_datetime,
        m.member_name,
        coalesce(m.member_logo_url, 0x58) AS member_logo_url,
        o.organisation_name AS gs1_mo_name,
        o.gs1_mo_primary_gln
    FROM
        gs1resolver_dataentry_db.accounts  AS a
            INNER JOIN gs1resolver_dataentry_db.members  AS m
                       ON a.member_primary_gln = m.member_primary_gln
            INNER JOIN gs1resolver_dataentry_db.gs1_mos  AS o
                       ON o.gs1_mo_primary_gln = m.gs1_mo_primary_gln
    WHERE
            a.login_email = @var_email AND
            a.login_password = gs1resolver_dataentry_db.PW_ENCRYPT(@var_password) AND
            a.active = 1 AND
            m.active = 1

    UPDATE gs1resolver_dataentry_db.accounts
    SET
        last_login_datetime = getdate()
    WHERE
            accounts.login_email = @var_email AND
            accounts.login_password = gs1resolver_dataentry_db.PW_ENCRYPT(@var_password) AND
            accounts.active = 1

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_administrator_level]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_administrator_level]
@var_session_id nchar(50)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT a.administrator
    FROM
        gs1resolver_dataentry_db.accounts  AS a
            INNER JOIN gs1resolver_dataentry_db.sessions  AS s
                       ON a.account_id = s.account_id
    WHERE s.session_id = @var_session_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_change_password]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_change_password]
    @var_account_id int,
    @var_new_password nvarchar(100)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    UPDATE gs1resolver_dataentry_db.accounts
    SET
        login_password = gs1resolver_dataentry_db.PW_ENCRYPT(@var_new_password)
    WHERE accounts.account_id = @var_account_id

    SELECT N'Password changed successfully' AS result

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_list_accounts]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_list_accounts]
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT
        a.login_email,
        a.firstname,
        a.surname,
        m.member_primary_gln,
        m.member_name,
        mo.organisation_name,
        a.account_notes,
        a.administrator
    FROM
        gs1resolver_dataentry_db.accounts  AS a
            INNER JOIN gs1resolver_dataentry_db.members  AS m
                       ON a.member_primary_gln = m.member_primary_gln
            INNER JOIN gs1resolver_dataentry_db.gs1_mos  AS mo
                       ON mo.gs1_mo_primary_gln = m.gs1_mo_primary_gln
    ORDER BY a.account_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_existing_contexts_item]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO



CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_existing_contexts_item]
    @var_context_id int,
    @var_context_value nvarchar(30),
    @var_context_description nvarchar(100),
    @var_default_context_flag bit
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    BEGIN TRANSACTION

        IF @var_default_context_flag = 1
            UPDATE [gs1resolver_dataentry_db].[list_contexts]
            SET default_context_flag = 0
            WHERE NOT context_id = @var_context_id

        UPDATE [gs1resolver_dataentry_db].[list_contexts]
        SET
            context_value  =  @var_context_value,
            description = @var_context_description,
            default_context_flag = @var_default_context_flag
        WHERE context_id = @var_context_id

    COMMIT TRANSACTION

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_existing_gs1_key_components_item]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_existing_gs1_key_components_item]
    @var_gs1_key_component_id int,
    @var_gs1_key_code nvarchar(20),
    @var_component_order smallint,
    @var_component_uri_id nvarchar(10),
    @var_component_name nvarchar(45),
    @var_accepted_formats nvarchar(100)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON
    UPDATE [gs1resolver_dataentry_db].[list_gs1_key_components]
    SET
        gs1_key_code = @var_gs1_key_code,
        component_order = @var_component_order,
        component_uri_id = @var_component_uri_id,
        component_name = @var_component_name,
        accepted_formats = @var_accepted_formats
    WHERE gs1_key_component_id = @var_gs1_key_component_id


END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_existing_linktypes_item]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO



CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_existing_linktypes_item]
    @var_linktype_id int,
    @var_linktype_name nvarchar(45),
    @var_linktype_reference_url nvarchar(255),
    @var_applicable_gs1_key_code nvarchar(20)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    UPDATE [gs1resolver_dataentry_db].[list_linktypes]
    SET
        linktype_name  =  @var_linktype_name,
        linktype_reference_url = @var_linktype_reference_url,
        applicable_gs1_key_code = @var_applicable_gs1_key_code
    WHERE linktype_id = @var_linktype_id


END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_existing_mime_types_item]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO



CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_existing_mime_types_item]
    @var_mime_type_id int,
    @var_mime_type_value nvarchar(30),
    @var_mime_type_description nvarchar(100),
    @var_default_mime_type_flag bit
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    BEGIN TRANSACTION

        IF @var_default_mime_type_flag = 1
            UPDATE [gs1resolver_dataentry_db].[list_mime_types]
            SET default_mime_type_flag = 0
            WHERE NOT mime_type_id = @var_mime_type_id

        UPDATE [gs1resolver_dataentry_db].[list_mime_types]
        SET
            mime_type_value  =  @var_mime_type_value,
            description = @var_mime_type_description,
            default_mime_type_flag = @var_default_mime_type_flag
        WHERE mime_type_id = @var_mime_type_id

    COMMIT TRANSACTION

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_account]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_account]
    @var_member_primary_gln nchar(13),
    @var_firstname nvarchar(25),
    @var_surname nvarchar(45),
    @var_login_password nvarchar(100),
    @var_login_email nvarchar(100),
    @var_account_notes nvarchar(1024),
    @var_administrator nchar(1),
    @var_active smallint
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON


    INSERT  INTO [gs1resolver_dataentry_db].[accounts]
    (
        member_primary_gln,
        firstname,
        surname,
        login_password,
        login_email,
        account_notes,
        administrator,
        active
    )
    VALUES
    (
        @var_member_primary_gln,
        @var_firstname,
        @var_surname,
        [gs1resolver_dataentry_db].PW_ENCRYPT(@var_login_password),
        @var_login_email,
        @var_account_notes,
        @var_administrator,
        @var_active
    )


END
GO

/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[delete_uri_request]    Script Date: 08/10/2019 15:48:17 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [gs1resolver_dataentry_db].[delete_uri_request]
@var_uri_request_id int
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    UPDATE gs1resolver_dataentry_db.uri_requests
    SET flagged_for_deletion = 1
    WHERE uri_request_id = @var_uri_request_id

END
GO

/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_contexts_item]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_contexts_item]
    @var_context_value nvarchar(30),
    @var_context_description nvarchar(100),
    @var_default_context_flag bit
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    INSERT  INTO [gs1resolver_dataentry_db].[list_contexts]
    (
        context_value,
        description,
        default_context_flag
    )
    VALUES
    (
        @var_context_value,
        @var_context_description,
        @var_default_context_flag
    )

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_gs1_key_component]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.


'$gs1KeyCode', $componentOrder, '$componentUriId', '$componentName', '$acceptedFormats')
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_gs1_key_component]
    @var_gs1_key_code nvarchar(20),
    @var_component_order smallint,
    @var_component_uri_id nvarchar(10),
    @var_component_name nvarchar(45),
    @var_accepted_formats nvarchar(100)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    INSERT INTO [gs1resolver_dataentry_db].[list_gs1_key_components]
    ([gs1_key_code]
    ,[component_order]
    ,[component_uri_id]
    ,[component_name]
    ,[accepted_formats])
    VALUES
    (
        @var_gs1_key_code,
        @var_component_order,
        @var_component_uri_id,
        @var_component_name,
        @var_accepted_formats
    )

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_gs1_key_components_item]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_gs1_key_components_item]
    @var_gs1_key_code nvarchar(20),
    @var_component_order smallint,
    @var_component_uri_id nvarchar(10),
    @var_component_name nvarchar(45),
    @var_accepted_formats nvarchar(100)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    INSERT INTO gs1resolver_dataentry_db.list_gs1_key_components
    (
        gs1_key_code,
        component_order,
        component_uri_id,
        component_name,
        accepted_formats
    )
    VALUES
    (
        @var_gs1_key_code,
        @var_component_order,
        @var_component_uri_id,
        @var_component_name,
        @var_accepted_formats
    )



END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_gs1mo]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_gs1mo]
    @var_gs1_mo_primary_gln nchar(13),
    @var_organisation_name nvarchar(45)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DELETE gs1_mos
    WHERE gs1_mo_primary_gln = @var_gs1_mo_primary_gln

    INSERT INTO gs1resolver_dataentry_db.gs1_mos
    (
        gs1_mo_primary_gln,
        organisation_name
    )
    VALUES
    (
        @var_gs1_mo_primary_gln,
        @var_organisation_name
    )

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_linktypes_item]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_linktypes_item]
    @var_linktype_name nvarchar(45),
    @var_linktype_reference_url nvarchar(255),
    @var_applicable_gs1_key_code nvarchar(20)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    INSERT  INTO [gs1resolver_dataentry_db].[list_linktypes]
    (
        linktype_name,
        linktype_reference_url,
        applicable_gs1_key_code
    )
    VALUES
    (
        @var_linktype_name,
        @var_linktype_reference_url,
        @var_applicable_gs1_key_code
    )

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_member]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_member]
    @var_member_primary_gln nchar(13),
    @var_member_name nvarchar(45),
    @var_gs1_mo_primary_gln nchar(13),
    @var_notes nvarchar(1024),
    @var_active smallint,
    @var_member_logo_url nvarchar(max)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DELETE FROM [gs1resolver_dataentry_db].[members]
    WHERE member_primary_gln = @var_member_primary_gln

    INSERT INTO [gs1resolver_dataentry_db].[members]
    (
        member_primary_gln,
        member_name,
        gs1_mo_primary_gln,
        notes,
        active,
        member_logo_url
    )
    VALUES
    (
        @var_member_primary_gln,
        @var_member_name,
        @var_gs1_mo_primary_gln,
        @var_notes,
        @var_active,
        @var_member_logo_url
    )

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[ADMIN_save_new_mime_types_item]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [gs1resolver_dataentry_db].[ADMIN_save_new_mime_types_item]
    @var_mime_type_value nvarchar(30),
    @var_mime_type_description nvarchar(100),
    @var_default_mime_type_flag bit
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    INSERT  INTO [gs1resolver_dataentry_db].[list_mime_types]
    (
        mime_type_value,
        description,
        default_mime_type_flag
    )
    VALUES
    (
        @var_mime_type_value,
        @var_mime_type_description,
        @var_default_mime_type_flag
    )

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_DeleteUriRecord]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [gs1resolver_dataentry_db].[BUILD_DeleteUriRecord]
@var_uri_request_id int
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DELETE FROM gs1resolver_dataentry_db.uri_responses
    WHERE uri_request_id = @var_uri_request_id

    DELETE FROM gs1resolver_dataentry_db.uri_requests
    WHERE uri_request_id = @var_uri_request_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_FlagUriRequestAsBuilt]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [gs1resolver_dataentry_db].[BUILD_FlagUriRequestAsBuilt]
@var_uri_request_id int
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    UPDATE gs1resolver_dataentry_db.uri_requests
    SET
        api_builder_processed = 1
    WHERE uri_requests.uri_request_id = @var_uri_request_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_get_gcp_resolves_list]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [gs1resolver_dataentry_db].[BUILD_get_gcp_resolves_list]
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON

/****** Script for SelectTopNRows command from SSMS  ******/
    SELECT [gcp_resolve_id]
         ,[member_primary_gln]
         ,[gs1_key_code]
         ,[gs1_gcp_value]
         ,[resolve_url_format]
         ,[notes]
    FROM [gs1resolver_dataentry_db].[gcp_resolves]
    WHERE api_builder_processed = 0

    UPDATE [gs1resolver_dataentry_db].[gcp_resolves]
    SET api_builder_processed = 1
    WHERE api_builder_processed = 0

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_GetURIRequestCount]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[BUILD_GetURIRequestCount]
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT count_big(*) AS uri_request_count
    FROM gs1resolver_dataentry_db.uri_requests
    WHERE uri_requests.api_builder_processed = 0 AND uri_requests.active = 1

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_GetURIRequests]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[BUILD_GetURIRequests]
@var_max_rows_to_return int
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON
    /*
    This procedure finds all Resolver records that need updating (api_builder_processed = 0)
    and expands the search to include all instances of the same GS1 Key Code and Value (including
    those those that don't need processing). The reason for this is because Builder recreates the
    MongoDB Resolver Document for that GS1 Key Code and Value from scratch, thus illiminating
    deleted or obselete instances of individual URIs no longer in the SQL database.

    So, if there are two SQL database entries for /gtin/123456788901234 and one is flagged as
    api_builder_processed = 0, the other as api_builder_processed = 1, both get returned (as long
    as both are also set as 'active = 1'.

    It's important that the returned set of rows is in gs1 key code / gs1 key value order, as
    Builder detects the boundary between two different values and uses it to delete the MongoDB
    record and tart rebuilding it.
    */
    SELECT DISTINCT TOP (@var_max_rows_to_return)
    [gs1_key_code],
    [gs1_key_value]
    INTO #temp_gs1_key_codes_values
    FROM [uri_requests]
    WHERE api_builder_processed = 0

    SELECT
        r.uri_request_id,
        r.member_primary_gln,
        r.gs1_key_code,
        r.gs1_key_value,
        r.item_description,
        r.date_inserted,
        r.date_last_updated,
        r.web_uri_prefix_1,
        r.web_uri_suffix_1,
        r.web_uri_prefix_2,
        r.web_uri_suffix_2,
        r.web_uri_prefix_3,
        r.web_uri_suffix_3,
        r.web_uri_prefix_4,
        r.web_uri_suffix_4,
        r.include_in_sitemap,
        r.active,
        r.flagged_for_deletion
    FROM [gs1resolver_dataentry_db].[uri_requests] r
             INNER JOIN #temp_gs1_key_codes_values t ON r.gs1_key_code = t.gs1_key_code AND r.gs1_key_value = t.gs1_key_value
    ORDER BY r.gs1_key_code, r.gs1_key_value

    DROP TABLE #temp_gs1_key_codes_values
END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_GetURIResponses]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[BUILD_GetURIResponses]
@var_uri_request_id int
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT
        [uri_response_id],
        [uri_request_id],
        [linktype],
        [friendly_link_name],
        l.linktype_name as official_link_name,
        [iana_language],
        [context],
        [mime_type],
        [destination_uri],
        [forward_request_querystrings],
        [active],
        [default_linktype],
        [default_iana_language],
        [default_context],
        [default_mime_type]
    FROM [gs1resolver_dataentry_db].[uri_responses] r
             LEFT JOIN [gs1resolver_dataentry_db].[list_linktypes] l ON r.linktype = l.linktype_reference_url
    WHERE uri_request_id = @var_uri_request_id AND active = 1
    ORDER BY
        [uri_response_id],
        [linktype],
        [iana_language],
        [context],
        [mime_type]

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[BUILD_SetToRequireRebuild]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [gs1resolver_dataentry_db].[BUILD_SetToRequireRebuild]
(
    -- Add the parameters for the stored procedure here
    @var_gs1_key_code nvarchar(20),
    @var_gs1_key_value nvarchar(45)
)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON

    -- Insert statements for procedure here
    UPDATE gs1resolver_dataentry_db.uri_requests
    SET api_builder_processed = 0
    WHERE gs1_key_code = @var_gs1_key_code
      AND gs1_key_value = @var_gs1_key_value

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[change_password]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[change_password]
    @var_account_id int,
    @var_existing_password nvarchar(100),
    @var_new_password nvarchar(100)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DECLARE
        @var_stored_password nvarchar(100)

    SELECT @var_stored_password = accounts.login_password
    FROM gs1resolver_dataentry_db.accounts
    WHERE accounts.account_id = @var_account_id

    IF @var_stored_password = gs1resolver_dataentry_db.PW_ENCRYPT(@var_existing_password)
        BEGIN

            UPDATE gs1resolver_dataentry_db.accounts
            SET
                login_password = gs1resolver_dataentry_db.PW_ENCRYPT(@var_new_password)
            WHERE accounts.account_id = @var_account_id

            SELECT N'Y' AS result

        END
    ELSE
        SELECT N'N' AS result

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[check_for_duplicate_request_record]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [gs1resolver_dataentry_db].[check_for_duplicate_request_record]
    @var_uri_request_id int,
    @var_gs1_key_code nvarchar(20),
    @var_gs1_key_value nvarchar(45),
    @var_web_uri_prefix_1 nvarchar(10),
    @var_web_uri_suffix_1 nvarchar(45),
    @var_web_uri_prefix_2 nvarchar(10),
    @var_web_uri_suffix_2 nvarchar(45),
    @var_web_uri_prefix_3 nvarchar(10),
    @var_web_uri_suffix_3 nvarchar(45),
    @var_web_uri_prefix_4 nvarchar(10),
    @var_web_uri_suffix_4 nvarchar(45)

AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT
        r.uri_request_id AS dup_request_id
    FROM
        gs1resolver_dataentry_db.uri_requests  AS r
    WHERE   r.gs1_key_code = @var_gs1_key_code
      AND    r.gs1_key_value = @var_gs1_key_value
      AND r.web_uri_prefix_1 = @var_web_uri_prefix_1
      AND r.web_uri_suffix_1 = @var_web_uri_suffix_1
      AND r.web_uri_prefix_2 = @var_web_uri_prefix_2
      AND r.web_uri_suffix_2 = @var_web_uri_suffix_2
      AND r.web_uri_prefix_3 = @var_web_uri_prefix_3
      AND r.web_uri_suffix_3 = @var_web_uri_suffix_3
      AND r.web_uri_prefix_4 = @var_web_uri_prefix_4
      AND r.web_uri_suffix_4 = @var_web_uri_suffix_4
      AND NOT r.uri_request_id = @var_uri_request_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[create_new_uri_request]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[create_new_uri_request]
@var_session_id nchar(50)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DECLARE
        @var_member_primary_gln nchar(13)

    SELECT @var_member_primary_gln = sessions.member_primary_gln
    FROM gs1resolver_dataentry_db.sessions
    WHERE sessions.session_id = @var_session_id

    INSERT  INTO gs1resolver_dataentry_db.uri_requests
    (
        member_primary_gln,
        gs1_key_code,
        gs1_key_value,
        item_description,
        api_builder_processed,
        active
    )
    VALUES
    (
        @var_member_primary_gln,
        'gtin',
        '0',
        '*NEW*',
        1,
        0
    )

    SELECT SCOPE_IDENTITY() AS new_uri_request_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[delete_uri_response]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[delete_uri_response]
@var_uri_response_id int
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DELETE
    FROM gs1resolver_dataentry_db.uri_responses
    WHERE uri_responses.uri_response_id = @var_uri_response_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_1000_responses_to_healthcheck]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [gs1resolver_dataentry_db].[get_1000_responses_to_healthcheck]
(
    @var_minimum_response_id int
)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON

    SELECT TOP 1000
    r.uri_response_id,
    r.destination_uri,
    h.health_status,
    h.attempt_count_since_last_green,
    h.latest_test_datetime
    FROM uri_responses r LEFT JOIN uri_response_health_checks h
                                   ON r.uri_response_id = h.uri_response_id
    WHERE r.uri_response_id >= @var_minimum_response_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_account_details]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[get_account_details]
    @var_wanted_account_id int,
    @var_session_id nchar(50)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DECLARE
        @var_requesting_account_id int

    DECLARE
        @var_administrator nchar(1)

    DECLARE
        @var_requesting_member_gln nchar(13)

    DECLARE
        @var_requesting_mo_gln nchar(13)

    SELECT @var_requesting_account_id = a.account_id, @var_administrator = a.administrator, @var_requesting_member_gln = a.member_primary_gln, @var_requesting_mo_gln = m.gs1_mo_primary_gln
    FROM
        gs1resolver_dataentry_db.accounts  AS a
            INNER JOIN gs1resolver_dataentry_db.members  AS m
                       ON a.member_primary_gln = m.member_primary_gln
            INNER JOIN gs1resolver_dataentry_db.sessions  AS s
                       ON s.account_id = a.account_id
    WHERE s.session_id = @var_session_id

    IF @var_administrator = 'G'
        BEGIN
            SELECT
                a.account_id,
                a.login_email,
                a.firstname,
                a.surname,
                m.member_primary_gln,
                m.member_name,
                mo.gs1_mo_primary_gln,
                mo.organisation_name,
                a.account_notes,
                a.administrator,
                a.active,
                a.last_login_datetime
            FROM
                gs1resolver_dataentry_db.accounts  AS a
                    INNER JOIN gs1resolver_dataentry_db.members  AS m
                               ON a.member_primary_gln = m.member_primary_gln
                    INNER JOIN gs1resolver_dataentry_db.gs1_mos  AS mo
                               ON mo.gs1_mo_primary_gln = m.gs1_mo_primary_gln
            WHERE a.account_id = @var_wanted_account_id
        END
    ELSE
        IF @var_administrator = 'O'
            BEGIN
                SELECT
                    a.account_id,
                    a.login_email,
                    a.firstname,
                    a.surname,
                    m.member_primary_gln,
                    m.member_name,
                    mo.gs1_mo_primary_gln,
                    mo.organisation_name,
                    a.account_notes,
                    a.administrator,
                    a.active,
                    a.last_login_datetime
                FROM
                    gs1resolver_dataentry_db.accounts  AS a
                        INNER JOIN gs1resolver_dataentry_db.members  AS m
                                   ON a.member_primary_gln = m.member_primary_gln
                        INNER JOIN gs1resolver_dataentry_db.gs1_mos  AS mo
                                   ON mo.gs1_mo_primary_gln = m.gs1_mo_primary_gln
                WHERE a.account_id = @var_wanted_account_id AND m.gs1_mo_primary_gln = @var_requesting_mo_gln
            END
        ELSE
            IF @var_administrator = 'M'
                BEGIN
                    SELECT
                        a.account_id,
                        a.login_email,
                        a.firstname,
                        a.surname,
                        m.member_primary_gln,
                        m.member_name,
                        mo.gs1_mo_primary_gln,
                        mo.organisation_name,
                        a.account_notes,
                        a.administrator,
                        a.active,
                        a.last_login_datetime
                    FROM
                        gs1resolver_dataentry_db.accounts  AS a
                            INNER JOIN gs1resolver_dataentry_db.members  AS m
                                       ON a.member_primary_gln = m.member_primary_gln
                            INNER JOIN gs1resolver_dataentry_db.gs1_mos  AS mo
                                       ON mo.gs1_mo_primary_gln = m.gs1_mo_primary_gln
                    WHERE a.account_id = @var_wanted_account_id AND m.member_primary_gln = @var_requesting_member_gln
                END
            ELSE
                BEGIN
                    SELECT
                        a.account_id,
                        a.login_email,
                        a.firstname,
                        a.surname,
                        m.member_primary_gln,
                        m.member_name,
                        mo.gs1_mo_primary_gln,
                        mo.organisation_name,
                        a.account_notes,
                        a.administrator,
                        a.active,
                        a.last_login_datetime
                    FROM
                        gs1resolver_dataentry_db.accounts  AS a
                            INNER JOIN gs1resolver_dataentry_db.members  AS m
                                       ON a.member_primary_gln = m.member_primary_gln
                            INNER JOIN gs1resolver_dataentry_db.gs1_mos  AS mo
                                       ON mo.gs1_mo_primary_gln = m.gs1_mo_primary_gln
                    WHERE a.account_id = @var_wanted_account_id AND a.account_id = @var_requesting_account_id
                END

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_active_linktypes_list]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [gs1resolver_dataentry_db].[get_active_linktypes_list]

AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON

    -- Insert statements for procedure here
    SELECT DISTINCT linktype_id,
                    l.locale,
                    l.linktype_name,
                    l.linktype_reference_url,
                    l.applicable_gs1_key_code,
                    l.description
    FROM gs1resolver_dataentry_db.list_linktypes l
             INNER JOIN gs1resolver_dataentry_db.uri_responses r
                        ON l.linktype_reference_url = r.linktype
    ORDER BY l.locale, l.linktype_name
END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_contexts_list]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:      <Author, , Name>
-- Create Date: <Create Date, , >
-- Description: <Description, , >
-- =============================================
CREATE PROCEDURE [gs1resolver_dataentry_db].[get_contexts_list]

AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
-- interfering with SELECT statements.
    SET NOCOUNT ON

    SELECT
        context_id,
        context_value,
        description,
        default_context_flag
    FROM
        [gs1resolver_dataentry_db].[list_contexts]
    ORDER BY
        context_value

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_key_code_components_list]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [gs1resolver_dataentry_db].[get_key_code_components_list]
@var_gs1_key_code nvarchar(20)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    IF @var_gs1_key_code = ''
        SELECT
            gs1_key_component_id,
            gs1_key_code,
            component_order,
            component_uri_id,
            component_name,
            accepted_formats
        FROM gs1resolver_dataentry_db.list_gs1_key_components
        ORDER BY gs1_key_code, component_order
    ELSE
        SELECT
            gs1_key_component_id,
            gs1_key_code,
            component_order,
            component_uri_id,
            component_name,
            accepted_formats
        FROM gs1resolver_dataentry_db.list_gs1_key_components
        WHERE gs1_key_code = @var_gs1_key_code
        ORDER BY component_order

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_linktypes_list]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [gs1resolver_dataentry_db].[get_linktypes_list]
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT linktype_id,
           locale,
           linktype_name,
           linktype_reference_url,
           applicable_gs1_key_code,
           description
    FROM gs1resolver_dataentry_db.list_linktypes
    ORDER BY locale, linktype_name

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_member_primary_gln_from_session_id]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[get_member_primary_gln_from_session_id]
@var_session_id nchar(50)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT m.member_primary_gln
    FROM
        gs1resolver_dataentry_db.members  AS m
            INNER JOIN gs1resolver_dataentry_db.sessions  AS s
                       ON m.member_primary_gln = s.member_primary_gln
    WHERE s.session_id = @var_session_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_mime_types_list]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:      <Author, , Name>
-- Create Date: <Create Date, , >
-- Description: <Description, , >
-- =============================================
CREATE PROCEDURE [gs1resolver_dataentry_db].[get_mime_types_list]

AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
-- interfering with SELECT statements.
    SET NOCOUNT ON

    SELECT
        mime_type_id,
        mime_type_value,
        description,
        default_mime_type_flag
    FROM
        [gs1resolver_dataentry_db].[list_mime_types]
    ORDER BY
        mime_type_value

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_request_uri_for_edit]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[get_request_uri_for_edit]
    @var_session_id nchar(50),
    @var_uri_request_id int
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT
        r.uri_request_id,
        r.gs1_key_code,
        r.gs1_key_value,
        r.item_description,
        r.date_inserted,
        r.date_last_updated,
        r.active,
        r.web_uri_prefix_1,
        r.web_uri_suffix_1,
        r.web_uri_prefix_2,
        r.web_uri_suffix_2,
        r.web_uri_prefix_3,
        r.web_uri_suffix_3,
        r.web_uri_prefix_4,
        r.web_uri_suffix_4,
        r.include_in_sitemap,
        r.active,
        r.flagged_for_deletion,
        r.api_builder_processed
    FROM
        gs1resolver_dataentry_db.uri_requests  AS r
            INNER JOIN gs1resolver_dataentry_db.sessions  AS s
                       ON r.member_primary_gln = s.member_primary_gln
    WHERE s.session_id = @var_session_id AND r.uri_request_id = @var_uri_request_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_request_uri_status]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[get_request_uri_status]
@var_uri_request_id int
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT
        uri_requests.active,
        uri_requests.api_builder_processed
    FROM gs1resolver_dataentry_db.uri_requests
    WHERE uri_requests.uri_request_id = @var_uri_request_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_request_uris]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [gs1resolver_dataentry_db].[get_request_uris]
    @var_session_id nchar(50),
    @first_line_number int,
    @max_number_of_lines int
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT     ROW_NUMBER() OVER (ORDER BY r.uri_request_id) as rownum,
               r.uri_request_id,
               r.member_primary_gln,
               r.gs1_key_code,
               r.gs1_key_value,
               r.item_description,
               r.date_inserted,
               r.date_last_updated,
               r.web_uri_prefix_1,
               r.web_uri_suffix_1,
               r.web_uri_prefix_2,
               r.web_uri_suffix_2,
               r.web_uri_prefix_3,
               r.web_uri_suffix_3,
               r.web_uri_prefix_4,
               r.web_uri_suffix_4,
               r.include_in_sitemap,
               r.active,
               r.flagged_for_deletion,
               r.api_builder_processed
    INTO #temp_get_request_uris
    FROM
        gs1resolver_dataentry_db.uri_requests  AS r
            INNER JOIN gs1resolver_dataentry_db.sessions  AS s
                       ON s.member_primary_gln = r.member_primary_gln
    WHERE
            s.session_id = @var_session_id
    ORDER BY r.uri_request_id

    SELECT TOP (@max_number_of_lines)
    uri_request_id,
    member_primary_gln,
    gs1_key_code,
    gs1_key_value,
    item_description,
    date_inserted,
    date_last_updated,
    web_uri_prefix_1,
    web_uri_suffix_1,
    web_uri_prefix_2,
    web_uri_suffix_2,
    web_uri_prefix_3,
    web_uri_suffix_3,
    web_uri_prefix_4,
    web_uri_suffix_4,
    include_in_sitemap,
    active,
    flagged_for_deletion,
    api_builder_processed
    FROM #temp_get_request_uris
    WHERE rownum >= @first_line_number
END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_response_uris_for_request]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [gs1resolver_dataentry_db].[get_response_uris_for_request]
    @var_session_id nchar(50),
    @var_uri_request_id int
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT
        [uri_response_id],
        req.[uri_request_id],
        [linktype],
        [iana_language],
        [context],
        [mime_type],
        [friendly_link_name],
        [destination_uri],
        [default_linktype],
        [default_iana_language],
        [default_context],
        [default_mime_type],
        [forward_request_querystrings],
        res.[active]
    FROM [gs1resolver_dataentry_db].[uri_responses] res
             INNER JOIN [gs1resolver_dataentry_db].[uri_requests] req ON req.uri_request_id = res.uri_request_id
             INNER JOIN [gs1resolver_dataentry_db].[sessions] ses ON req.member_primary_gln = ses.member_primary_gln
    WHERE req.uri_request_id = @var_uri_request_id
      AND ses.session_id = @var_session_id
    ORDER BY [linktype], [iana_language], [context], [mime_type]


END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[get_session]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[get_session]
@var_session_id nchar(50)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DECLARE
        @var_account_id int

    DECLARE
        @var_member_primary_gln nchar(13)

    DECLARE
        @var_member_name nvarchar(255)

    DECLARE
        @var_gs1_mo_primary_gln nchar(13)

    DECLARE
        @var_organisation_name nvarchar(45)

    SELECT @var_account_id = sessions.account_id, @var_member_primary_gln = sessions.member_primary_gln
    FROM gs1resolver_dataentry_db.sessions
    WHERE sessions.session_id = @var_session_id

    SELECT @var_member_name = members.member_name, @var_gs1_mo_primary_gln = members.gs1_mo_primary_gln
    FROM gs1resolver_dataentry_db.members
    WHERE members.member_primary_gln = @var_member_primary_gln

    SELECT @var_organisation_name = gs1_mos.organisation_name
    FROM gs1resolver_dataentry_db.gs1_mos
    WHERE gs1_mos.gs1_mo_primary_gln = @var_gs1_mo_primary_gln

    SELECT
        accounts.account_id,
        accounts.member_primary_gln,
        @var_member_name AS member_name,
        @var_gs1_mo_primary_gln AS gs1_mo_primary_gln,
        @var_organisation_name AS organisation_name,
        accounts.firstname,
        accounts.surname,
        accounts.login_password,
        accounts.login_email,
        accounts.account_notes,
        accounts.last_login_datetime,
        accounts.administrator,
        accounts.active
    FROM gs1resolver_dataentry_db.accounts
    WHERE accounts.account_id = @var_account_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[HEALTH_get_1000_responses_to_healthcheck]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [gs1resolver_dataentry_db].[HEALTH_get_1000_responses_to_healthcheck]
(
    @var_minimum_response_id int
)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON

    SELECT TOP 1000
    r.uri_response_id,
    r.destination_uri,
    h.health_status,
    h.attempt_count_since_last_green,
    h.latest_test_datetime
    FROM uri_responses r LEFT JOIN uri_response_health_checks h
                                   ON r.uri_response_id = h.uri_response_id
    WHERE r.uri_response_id >= @var_minimum_response_id
    ORDER BY r.uri_response_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[HEALTH_save_healthcheck]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [gs1resolver_dataentry_db].[HEALTH_save_healthcheck]
(
    -- Add the parameters for the stored procedure here
    @var_uri_response_id int,
    @var_health_status nchar(1),
    @var_attempt_count_since_last_green smallint,
    @var_HTTP_code int,
    @var_error_response nvarchar(255)
)
AS
BEGIN

    SET NOCOUNT ON

    DECLARE @recordcount int

    SET @recordcount = (
        SELECT COUNT(*)
        FROM [gs1resolver_dataentry_db].[uri_response_health_checks]
        WHERE uri_response_id = @var_uri_response_id
    )

    IF @recordcount = 0
        INSERT INTO [gs1resolver_dataentry_db].[uri_response_health_checks]
        ([uri_response_id]
        ,[health_status]
        ,[attempt_count_since_last_green]
        ,[HTTP_code]
        ,[error_response]
        ,[latest_test_datetime])
        VALUES
        (@var_uri_response_id,
         @var_health_status,
         @var_attempt_count_since_last_green,
         @var_HTTP_code,
         @var_error_response,
         GETDATE());
    ELSE
        UPDATE [gs1resolver_dataentry_db].[uri_response_health_checks]
        SET [health_status] = @var_health_status,
            [attempt_count_since_last_green] = @var_attempt_count_since_last_green,
            [HTTP_code] = @var_HTTP_code,
            [error_response] = @var_error_response,
            [latest_test_datetime] = GETDATE()
        WHERE [uri_response_id] = @var_uri_response_id;


END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[is_administrator]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[is_administrator]
@var_account_id int
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT accounts.administrator
    FROM gs1resolver_dataentry_db.accounts
    WHERE accounts.account_id = @var_account_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[is_session_active]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[is_session_active]
@var_session_id nchar(50)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DECLARE
        @var_count smallint

    DECLARE
        @var_response_YN nchar(1)

    SELECT @var_count = count_big(*)
    FROM gs1resolver_dataentry_db.sessions
    WHERE sessions.session_id = @var_session_id AND sessions.datetime_created > dateadd(hour, -1, CAST(getdate() AS datetime2))

    IF @var_count = 0
        SET @var_response_YN = N'N'
    ELSE
        BEGIN

            SET @var_response_YN = N'Y'

/*
*   SSMA informational messages:
*   M2SS0231: Zero-date, zero-in-date and invalid dates to not null columns has been replaced with GetDate()/Constant date
*/

            UPDATE gs1resolver_dataentry_db.sessions
            SET
                datetime_created = isnull(getdate(), getdate())
            WHERE sessions.session_id = @var_session_id

        END

    SELECT @var_response_YN AS active

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[list_accounts_for_member]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[list_accounts_for_member]
@var_member_primary_gln nchar(13)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT accounts.account_id, accounts.firstname, accounts.surname
    FROM gs1resolver_dataentry_db.accounts
    WHERE accounts.member_primary_gln = @var_member_primary_gln
    ORDER BY accounts.surname, accounts.firstname

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[list_gs1_mos]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[list_gs1_mos]
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT gs1_mos.organisation_name, gs1_mos.gs1_mo_primary_gln
    FROM gs1resolver_dataentry_db.gs1_mos
    ORDER BY gs1_mos.organisation_name

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[list_members_for_gs1_mo]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[list_members_for_gs1_mo]
@var_gs1_mo_primary_gln nchar(13)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    SELECT members.member_name, members.member_primary_gln
    FROM gs1resolver_dataentry_db.members
    WHERE members.gs1_mo_primary_gln = @var_gs1_mo_primary_gln
    ORDER BY members.member_name

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[logThis]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [gs1resolver_dataentry_db].[logThis]
(
    -- Add the parameters for the stored procedure here
    @var_apiHostMachineId nvarchar(50),
    @var_logMessage nvarchar(max)
)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON

    -- Insert statements for procedure here
    INSERT INTO gs1resolver_dataentry_db.audit_log
    (
        apiHostMachineId,
        logMessage
    )
    VALUES
    (
        @var_apiHostMachineId,
        @var_logMessage
    )
END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[save_existing_account]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [gs1resolver_dataentry_db].[save_existing_account]
    @var_account_id int,
    @var_firstname nvarchar(25),
    @var_surname nvarchar(45),
    @var_login_email nvarchar(100),
    @var_existing_password nvarchar(100),
    @var_new_password nvarchar(100),
    @var_account_notes nvarchar(1024),
    @var_administrator nchar(1),
    @var_active bit
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DECLARE @var_encrypted_password_from_db nvarchar(100)
    DECLARE @new_encrypted_password_for_db nvarchar(100)

    /* Get the existing encrypted password from the database */
    SELECT @var_encrypted_password_from_db = login_password
    FROM gs1resolver_dataentry_db.accounts
    WHERE accounts.account_id = @var_account_id

    /* Check that the incoming existing password and the one in the database match each other */
    IF [gs1resolver_dataentry_db].PW_ENCRYPT(@var_existing_password) = @var_encrypted_password_from_db
        BEGIN

            IF @var_new_password = ''
                /* If the new password is set to blank then we'll just save the existing password back */
                SET @new_encrypted_password_for_db = @var_encrypted_password_from_db;
            ELSE
                /* We will save the new passord */
                SET @new_encrypted_password_for_db = [gs1resolver_dataentry_db].PW_ENCRYPT(@var_new_password);

            UPDATE gs1resolver_dataentry_db.accounts
            SET
                firstname = @var_firstname,
                surname = @var_surname,
                login_email = @var_login_email,
                login_password = @new_encrypted_password_for_db,
                account_notes = @var_account_notes,
                administrator = @var_administrator,
                active = @var_active
            WHERE accounts.account_id = @var_account_id

            SELECT 'Y' as result;  /* 'Y' signifies success */
        END
    ELSE
        SELECT 'P' as result  /* 'P' signifies that the password does match the one in the database account */

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[save_existing_uri_request]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[save_existing_uri_request]
    @var_uri_request_id int,
    @var_gs1_key_code nvarchar(20),
    @var_gs1_key_value nvarchar(45),
    @var_item_description nvarchar(200),
    @var_web_uri_prefix_1 nvarchar(10),
    @var_web_uri_suffix_1 nvarchar(45),
    @var_web_uri_prefix_2 nvarchar(10),
    @var_web_uri_suffix_2 nvarchar(45),
    @var_web_uri_prefix_3 nvarchar(10),
    @var_web_uri_suffix_3 nvarchar(45),
    @var_web_uri_prefix_4 nvarchar(10),
    @var_web_uri_suffix_4 nvarchar(45),
    @var_include_in_sitemap bit,
    @var_active bit
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    UPDATE gs1resolver_dataentry_db.uri_requests
    SET
        gs1_key_code = @var_gs1_key_code,
        gs1_key_value = @var_gs1_key_value,
        item_description = @var_item_description,
        web_uri_prefix_1 = @var_web_uri_prefix_1,
        web_uri_suffix_1 = @var_web_uri_suffix_1,
        web_uri_prefix_2 = @var_web_uri_prefix_2,
        web_uri_suffix_2 = @var_web_uri_suffix_2,
        web_uri_prefix_3 = @var_web_uri_prefix_3,
        web_uri_suffix_3 = @var_web_uri_suffix_3,
        web_uri_prefix_4 = @var_web_uri_prefix_4,
        web_uri_suffix_4 = @var_web_uri_suffix_4,
        date_last_updated = getdate(),
        include_in_sitemap = @var_include_in_sitemap,
        active = @var_active,
        api_builder_processed = 0
    WHERE uri_requests.uri_request_id = @var_uri_request_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[save_existing_uri_response]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/




CREATE PROCEDURE [gs1resolver_dataentry_db].[save_existing_uri_response]
    @var_uri_response_id int,
    @var_linktype nvarchar(100),
    @var_iana_language nchar(2),
    @var_context nvarchar(100),
    @var_mime_type nvarchar(45),
    @var_friendly_link_name nvarchar(45),
    @var_destination_uri nvarchar(1255),
    @var_forward_request_querystrings bit,
    @var_active bit,
    @var_default_linktype bit,
    @var_default_iana_language bit,
    @var_default_context bit,
    @var_default_mime_type bit
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DECLARE
        @var_uri_request_id int

    UPDATE gs1resolver_dataentry_db.uri_responses
    SET linktype = @var_linktype,
        iana_language = @var_iana_language,
        destination_uri = @var_destination_uri,
        context = @var_context,
        mime_type = @var_mime_type,
        friendly_link_name = @var_friendly_link_name,
        forward_request_querystrings = @var_forward_request_querystrings,
        active = @var_active,
        default_linktype = @var_default_linktype,
        default_iana_language = @var_default_iana_language,
        default_context = @var_default_context,
        default_mime_type = @var_default_mime_type
    WHERE uri_responses.uri_response_id = @var_uri_response_id

    SELECT @var_uri_request_id = uri_responses.uri_request_id
    FROM gs1resolver_dataentry_db.uri_responses
    WHERE uri_responses.uri_response_id = @var_uri_response_id

    UPDATE gs1resolver_dataentry_db.uri_requests
    SET api_builder_processed = 0
    WHERE uri_requests.uri_request_id = @var_uri_request_id

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[save_new_session]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [gs1resolver_dataentry_db].[save_new_session]
    @var_account_id int,
    @var_member_primary_gln nchar(13),
    @var_session_id nchar(50)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    INSERT INTO gs1resolver_dataentry_db.sessions
    (
        session_id,
        member_primary_gln,
        account_id
    )
    VALUES
    (
        @var_session_id,
        @var_member_primary_gln,
        @var_account_id
    )


/* Remove old sessions (older than 24 hours ago)*/
    DELETE gs1resolver_dataentry_db.sessions
    WHERE datetime_created < DATEADD(hour, -24, GETDATE())

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[save_new_uri_response]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*/

CREATE PROCEDURE [gs1resolver_dataentry_db].[save_new_uri_response]
    @var_uri_request_id int,
    @var_linktype nvarchar(100),
    @var_iana_language nchar(2),
    @var_context nvarchar(100),
    @var_mime_type nvarchar(45),
    @var_friendly_link_name nvarchar(45),
    @var_destination_uri nvarchar(1255),
    @var_forward_request_querystrings bit,
    @var_active bit,
    @var_default_linktype bit,
    @var_default_iana_language bit,
    @var_default_context bit,
    @var_default_mime_type bit
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    INSERT gs1resolver_dataentry_db.uri_responses
    (
        uri_request_id,
        linktype,
        iana_language,
        context,
        mime_type,
        friendly_link_name,
        destination_uri,
        default_linktype,
        default_iana_language,
        default_context,
        default_mime_type,
        forward_request_querystrings,
        active
    )
    VALUES
    (
        @var_uri_request_id,
        @var_linktype,
        @var_iana_language,
        @var_context,
        @var_mime_type,
        @var_friendly_link_name,
        @var_destination_uri,
        @var_default_linktype,
        @var_default_iana_language,
        @var_default_context,
        @var_default_mime_type,
        @var_forward_request_querystrings,
        @var_active
    )

END
GO
/****** Object:  StoredProcedure [gs1resolver_dataentry_db].[search_request_uris_by_gs1_key_value]    Script Date: 03/10/2019 14:08:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [gs1resolver_dataentry_db].[search_request_uris_by_gs1_key_code_and_value]
    @var_session_id nchar(50),
    @var_gs1_key_code nvarchar(20),
    @var_gs1_key_value nvarchar(45)
AS
BEGIN
    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @member_primary_gln nchar(13)

    SELECT @member_primary_gln = sessions.member_primary_gln
    FROM gs1resolver_dataentry_db.sessions
    WHERE sessions.session_id = @var_session_id

    SELECT TOP 1000
        uri_requests.uri_request_id,
        uri_requests.member_primary_gln,
        uri_requests.gs1_key_code,
        uri_requests.gs1_key_value,
        uri_requests.item_description,
        uri_requests.date_inserted,
        uri_requests.date_last_updated,
        uri_requests.web_uri_prefix_1,
        uri_requests.web_uri_suffix_1,
        uri_requests.web_uri_prefix_2,
        uri_requests.web_uri_suffix_2,
        uri_requests.web_uri_prefix_3,
        uri_requests.web_uri_suffix_3,
        uri_requests.web_uri_prefix_4,
        uri_requests.web_uri_suffix_4,
        uri_requests.active,
        CASE
            WHEN uri_requests.member_primary_gln = @member_primary_gln THEN 1 ELSE 0
        END AS editable
    FROM gs1resolver_dataentry_db.uri_requests
    WHERE
            uri_requests.gs1_key_code = @var_gs1_key_code AND
            uri_requests.gs1_key_value = @var_gs1_key_value

    END
GO



CREATE PROCEDURE [gs1resolver_dataentry_db].[search_request_uris_by_gs1_key_code]
    @var_session_id nchar(50),
    @var_gs1_key_code nvarchar(20)
AS
BEGIN
    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @member_primary_gln nchar(13)

    SELECT @member_primary_gln = sessions.member_primary_gln
    FROM gs1resolver_dataentry_db.sessions
    WHERE sessions.session_id = @var_session_id

    SELECT TOP 1000
        uri_requests.uri_request_id,
        uri_requests.member_primary_gln,
        uri_requests.gs1_key_code,
        uri_requests.gs1_key_value,
        uri_requests.item_description,
        uri_requests.date_inserted,
        uri_requests.date_last_updated,
        uri_requests.web_uri_prefix_1,
        uri_requests.web_uri_suffix_1,
        uri_requests.web_uri_prefix_2,
        uri_requests.web_uri_suffix_2,
        uri_requests.web_uri_prefix_3,
        uri_requests.web_uri_suffix_3,
        uri_requests.web_uri_prefix_4,
        uri_requests.web_uri_suffix_4,
        uri_requests.active,
        CASE
            WHEN uri_requests.member_primary_gln = @member_primary_gln THEN 1 ELSE 0
        END AS editable
    FROM gs1resolver_dataentry_db.uri_requests
    WHERE
            uri_requests.gs1_key_code = @var_gs1_key_code

END
GO




CREATE PROCEDURE [gs1resolver_dataentry_db].[search_request_uris_by_gs1_key_value]
    @var_session_id nchar(50),
    @var_gs1_key_value nvarchar(45)
AS
BEGIN
    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @member_primary_gln nchar(13)

    SELECT @member_primary_gln = sessions.member_primary_gln
    FROM gs1resolver_dataentry_db.sessions
    WHERE sessions.session_id = @var_session_id

    SELECT TOP 1000
        uri_requests.uri_request_id,
        uri_requests.member_primary_gln,
        uri_requests.gs1_key_code,
        uri_requests.gs1_key_value,
        uri_requests.item_description,
        uri_requests.date_inserted,
        uri_requests.date_last_updated,
        uri_requests.web_uri_prefix_1,
        uri_requests.web_uri_suffix_1,
        uri_requests.web_uri_prefix_2,
        uri_requests.web_uri_suffix_2,
        uri_requests.web_uri_prefix_3,
        uri_requests.web_uri_suffix_3,
        uri_requests.web_uri_prefix_4,
        uri_requests.web_uri_suffix_4,
        uri_requests.active,
        CASE
            WHEN uri_requests.member_primary_gln = @member_primary_gln THEN 1 ELSE 0
        END AS editable
    FROM gs1resolver_dataentry_db.uri_requests
    WHERE
            uri_requests.gs1_key_value = @var_gs1_key_value

END
GO