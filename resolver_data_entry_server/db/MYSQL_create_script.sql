USE `gs1-eu1-pd-resolver-db01`;

/****** Object:  Table [dbo].[gcp_redirects]    Script Date: 10/06/2020 17:31:15 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

CREATE TABLE gcp_redirects(
    `gcp_redirect_id` bigint AUTO_INCREMENT NOT NULL,
    `member_primary_gln` nchar(13) NOT NULL,
    `identification_key_type` nvarchar(20) NOT NULL,
    `prefix_value` nvarchar(45) NOT NULL,
    `target_url` nvarchar(1024) NOT NULL,
    `active` Tinyint NOT NULL,
    `flagged_for_deletion` Tinyint NOT NULL,
    `date_inserted` datetime(3) NOT NULL,
    `date_last_updated` datetime(3) NOT NULL,
    CONSTRAINT `PK_gcp_resolves` PRIMARY KEY
(
	`gcp_redirect_id` ASC
)
);
/****** Object:  Table [dbo].[resolver_auth]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

CREATE TABLE resolver_auth(
    `auth_id` bigint AUTO_INCREMENT NOT NULL,
    `member_primary_gln` nchar(13) NOT NULL,
    `account_name` nvarchar(255) NOT NULL,
    `authentication_key` nvarchar(64) NOT NULL,
    CONSTRAINT `PK_resolver_auth` PRIMARY KEY
(
	`auth_id` ASC
) ,
    CONSTRAINT `IX_Table_authentication_key` UNIQUE
(
	`authentication_key` ASC
)
);
/****** Object:  Table [dbo].[server_sync_register]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

CREATE TABLE server_sync_register(
    `resolver_sync_server_id` nchar(12) NOT NULL,
    `resolver_sync_server_hostname` nvarchar(100) NULL,
    `last_heard_datetime` datetime(3) NOT NULL,
    CONSTRAINT `PK_server_sync_register_table` PRIMARY KEY
(
	`resolver_sync_server_id` ASC
)
);
/****** Object:  Table [dbo].[uri_entries]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

CREATE TABLE uri_entries(
    `uri_entry_id` bigint AUTO_INCREMENT NOT NULL,
    `member_primary_gln` nchar(13) NOT NULL,
    `identification_key_type` nvarchar(20) NOT NULL,
    `identification_key` nvarchar(45) NOT NULL,
    `item_description` nvarchar(2000) NOT NULL,
    `date_inserted` datetime(3) NOT NULL,
    `date_last_updated` datetime(3) NOT NULL,
    `qualifier_path` nvarchar(255) NOT NULL,
    `active` Tinyint NOT NULL,
    `flagged_for_deletion` Tinyint NOT NULL,
    CONSTRAINT `PK_uri_requests_uri_request_id` PRIMARY KEY
(
	`uri_entry_id` ASC
)
);
/****** Object:  Table [dbo].[uri_entries_prevalid]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

CREATE TABLE uri_entries_prevalid(
    `uri_entry_id` bigint AUTO_INCREMENT NOT NULL,
    `member_primary_gln` nchar(13) NOT NULL,
    `identification_key_type` nvarchar(20) NOT NULL,
    `identification_key` nvarchar(45) NOT NULL,
    `item_description` nvarchar(2000) NOT NULL,
    `date_inserted` datetime(3) NOT NULL,
    `date_last_updated` datetime(3) NOT NULL,
    `qualifier_path` nvarchar(255) NOT NULL,
    `active` Tinyint NOT NULL,
    `flagged_for_deletion` Tinyint NOT NULL,
    `validation_code` tinyint Unsigned NOT NULL,
    `batch_id` int NOT NULL,
    CONSTRAINT `PK_uri_requests_prevalid_uri_entry_id` PRIMARY KEY
(
	`uri_entry_id` ASC
)
);
/****** Object:  Table [dbo].[uri_responses]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

CREATE TABLE uri_responses(
    `uri_response_id` bigint AUTO_INCREMENT NOT NULL,
    `uri_entry_id` bigint NOT NULL,
    `linktype` nvarchar(100) NOT NULL,
    `iana_language` nchar(2) NOT NULL,
    `context` nvarchar(100) NOT NULL,
    `mime_type` nvarchar(45) NOT NULL,
    `link_title` nvarchar(45) NOT NULL,
    `target_url` nvarchar(1024) NOT NULL,
    `default_linktype` Tinyint NOT NULL,
    `default_iana_language` Tinyint NOT NULL,
    `default_context` Tinyint NOT NULL,
    `default_mime_type` Tinyint NOT NULL,
    `forward_request_querystrings` Tinyint NOT NULL,
    `active` Tinyint NOT NULL,
    `flagged_for_deletion` Tinyint NOT NULL,
    `date_inserted` datetime(3) NOT NULL,
    `date_last_updated` datetime(3) NOT NULL,
    CONSTRAINT `PK_uri_responses_uri_response_id` PRIMARY KEY
(
	`uri_response_id` ASC
)
);
/****** Object:  Table [dbo].[uri_responses_prevalid]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

CREATE TABLE uri_responses_prevalid(
    `uri_response_id` bigint AUTO_INCREMENT NOT NULL,
    `uri_entry_id` bigint NOT NULL,
    `linktype` nvarchar(100) NOT NULL,
    `iana_language` nchar(2) NOT NULL,
    `context` nvarchar(100) NOT NULL,
    `mime_type` nvarchar(45) NOT NULL,
    `link_title` nvarchar(45) NOT NULL,
    `target_url` nvarchar(1024) NOT NULL,
    `default_linktype` Tinyint NOT NULL,
    `default_iana_language` Tinyint NOT NULL,
    `default_context` Tinyint NOT NULL,
    `default_mime_type` Tinyint NOT NULL,
    `forward_request_querystrings` Tinyint NOT NULL,
    `active` Tinyint NOT NULL,
    `flagged_for_deletion` Tinyint NOT NULL,
    `date_inserted` datetime(3) NOT NULL,
    `date_last_updated` datetime(3) NOT NULL,
    CONSTRAINT `PK_uri_responses_prevalid_uri_response_id` PRIMARY KEY
(
	`uri_response_id` ASC
)
);
/* SET ANSI_PADDING ON */

/****** Object:  Index [IX_gcp_resolves]    Script Date: 10/06/2020 17:31:16 ******/
CREATE UNIQUE NONCLUSTERED INDEX `IX_gcp_resolves` ON [dbo].[gcp_redirects]
    (
    `identification_key_type` ASC,
    `prefix_value` ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/* SET ANSI_PADDING ON */

/****** Object:  Index [IX_uri_entries_gln_keytype_key]    Script Date: 10/06/2020 17:31:16 ******/
CREATE NONCLUSTERED INDEX `IX_uri_entries_gln_keytype_key` ON [dbo].[uri_entries]
    (
    `member_primary_gln` ASC,
    `identification_key_type` ASC,
    `identification_key` ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/* SET ANSI_PADDING ON */

/****** Object:  Index [IX_uri_responses_unique_constraint_index]    Script Date: 10/06/2020 17:31:16 ******/
CREATE UNIQUE NONCLUSTERED INDEX `IX_uri_responses_unique_constraint_index` ON [dbo].[uri_responses]
    (
    `uri_entry_id` ASC,
    `linktype` ASC,
    `iana_language` ASC,
    `context` ASC,
    `mime_type` ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE `dbo`.`gcp_redirects` ADD  CONSTRAINT `DF_gcp_resolves_active`  DEFAULT ((0)) FOR `active`
GO
ALTER TABLE `dbo`.`gcp_redirects` ADD  CONSTRAINT `DF_gcp_resolves_marked_for_deletion`  DEFAULT ((0)) FOR `flagged_for_deletion`
GO
ALTER TABLE `dbo`.`gcp_redirects` ADD  CONSTRAINT `DF_gcp_redirects_date_inserted`  DEFAULT (utc_timestamp()) FOR `date_inserted`
GO
ALTER TABLE `dbo`.`gcp_redirects` ADD  CONSTRAINT `DF_gcp_redirects_date_last_updated`  DEFAULT (utc_timestamp()) FOR `date_last_updated`
GO
ALTER TABLE `dbo`.`server_sync_register` ADD  CONSTRAINT `DF_server_sync_register_table_last_heard_unixtime`  DEFAULT (utc_timestamp()) FOR `last_heard_datetime`
GO
ALTER TABLE `dbo`.`uri_entries` ADD  CONSTRAINT `DF__uri_reque__membe__236943A5`  DEFAULT ('') FOR `member_primary_gln`
GO
ALTER TABLE `dbo`.`uri_entries` ADD  CONSTRAINT `DF__uri_reque__gs1_k__245D67DE`  DEFAULT ('') FOR `identification_key_type`
GO
ALTER TABLE `dbo`.`uri_entries` ADD  CONSTRAINT `DF__uri_reque__gs1_k__25518C17`  DEFAULT ('') FOR `identification_key`
GO
ALTER TABLE `dbo`.`uri_entries` ADD  CONSTRAINT `DF__uri_reque__item___2645B050`  DEFAULT ('NEW') FOR `item_description`
GO
ALTER TABLE `dbo`.`uri_entries` ADD  CONSTRAINT `DF__uri_reque__date___2739D489`  DEFAULT (utc_timestamp()) FOR `date_inserted`
GO
ALTER TABLE `dbo`.`uri_entries` ADD  CONSTRAINT `DF__uri_reque__date___282DF8C2`  DEFAULT (utc_timestamp()) FOR `date_last_updated`
GO
ALTER TABLE `dbo`.`uri_entries` ADD  CONSTRAINT `DF__uri_reque__web_u__2A164134`  DEFAULT ('') FOR `qualifier_path`
GO
ALTER TABLE `dbo`.`uri_entries` ADD  CONSTRAINT `DF__uri_reque__activ__29221CFB`  DEFAULT ((1)) FOR `active`
GO
ALTER TABLE `dbo`.`uri_entries` ADD  CONSTRAINT `DF_uri_requests_flagged_for_deletion`  DEFAULT ((0)) FOR `flagged_for_deletion`
GO
ALTER TABLE `dbo`.`uri_entries_prevalid` ADD  CONSTRAINT `DF__uri_reque__membe__136943A5`  DEFAULT ('') FOR `member_primary_gln`
GO
ALTER TABLE `dbo`.`uri_entries_prevalid` ADD  CONSTRAINT `DF__uri_reque__gs1_k__145D67DE`  DEFAULT ('') FOR `identification_key_type`
GO
ALTER TABLE `dbo`.`uri_entries_prevalid` ADD  CONSTRAINT `DF__uri_reque__gs1_k__15518C17`  DEFAULT ('') FOR `identification_key`
GO
ALTER TABLE `dbo`.`uri_entries_prevalid` ADD  CONSTRAINT `DF__uri_reque__item___1645B050`  DEFAULT ('NEW') FOR `item_description`
GO
ALTER TABLE `dbo`.`uri_entries_prevalid` ADD  CONSTRAINT `DF__uri_reque__date___1739D489`  DEFAULT (utc_timestamp()) FOR `date_inserted`
GO
ALTER TABLE `dbo`.`uri_entries_prevalid` ADD  CONSTRAINT `DF__uri_reque__date___182DF8C2`  DEFAULT (utc_timestamp()) FOR `date_last_updated`
GO
ALTER TABLE `dbo`.`uri_entries_prevalid` ADD  CONSTRAINT `DF__uri_reque__web_u__1A164134`  DEFAULT ('') FOR `qualifier_path`
GO
ALTER TABLE `dbo`.`uri_entries_prevalid` ADD  CONSTRAINT `DF__uri_reque__activ__19221CFB`  DEFAULT ((1)) FOR `active`
GO
ALTER TABLE `dbo`.`uri_entries_prevalid` ADD  CONSTRAINT `DF_uri_requests_flagged_for_deletion1`  DEFAULT ((0)) FOR `flagged_for_deletion`
GO
ALTER TABLE `dbo`.`uri_entries_prevalid` ADD  CONSTRAINT `DF_uri_entries_validation_code1`  DEFAULT ((255)) FOR `validation_code`
GO
ALTER TABLE `dbo`.`uri_entries_prevalid` ADD  CONSTRAINT `DF_uri_entries_batch_id1`  DEFAULT ((0)) FOR `batch_id`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF__uri_respo__attri__3A4CA8FD`  DEFAULT ('') FOR `linktype`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF__uri_respo__iana___3864608B`  DEFAULT ('') FOR `iana_language`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF_uri_responses_context`  DEFAULT ('') FOR `context`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF__uri_respo__desti__40F9A68C`  DEFAULT (N'text/html') FOR `mime_type`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF__uri_respo__alt_a__3D2915A8`  DEFAULT ('') FOR `link_title`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF__uri_respo__desti__3B40CD36`  DEFAULT ('') FOR `target_url`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF_uri_responses_default_linktype`  DEFAULT ((0)) FOR `default_linktype`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF_uri_responses_default_iana_language`  DEFAULT ((0)) FOR `default_iana_language`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF_uri_responses_default_context`  DEFAULT ((0)) FOR `default_context`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF_uri_responses_default_mime_type`  DEFAULT ((0)) FOR `default_mime_type`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF__uri_respo__forwa__41EDCAC5`  DEFAULT ((0)) FOR `forward_request_querystrings`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF__uri_respo__activ__3E1D39E1`  DEFAULT ((0)) FOR `active`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF_uri_responses_flagged_for_deletion`  DEFAULT ((0)) FOR `flagged_for_deletion`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF_uri_responses_date_inserted`  DEFAULT (utc_timestamp()) FOR `date_inserted`
GO
ALTER TABLE `dbo`.`uri_responses` ADD  CONSTRAINT `DF_uri_responses_date_last_updated`  DEFAULT (utc_timestamp()) FOR `date_last_updated`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF__uri_respo__attri__1A4CA8FD`  DEFAULT ('') FOR `linktype`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF__uri_respo__iana___1864608B`  DEFAULT ('') FOR `iana_language`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF_uri_responses_context1`  DEFAULT ('') FOR `context`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF__uri_respo__desti__10F9A68C`  DEFAULT (N'text/html') FOR `mime_type`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF__uri_respo__alt_a__1D2915A8`  DEFAULT ('') FOR `link_title`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF__uri_respo__desti__1B40CD36`  DEFAULT ('') FOR `target_url`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF_uri_responses_default_linktype1`  DEFAULT ((0)) FOR `default_linktype`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF_uri_responses_default_iana_language1`  DEFAULT ((0)) FOR `default_iana_language`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF_uri_responses_default_context1`  DEFAULT ((0)) FOR `default_context`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF_uri_responses_default_mime_type1`  DEFAULT ((0)) FOR `default_mime_type`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF__uri_respo__forwa__11EDCAC5`  DEFAULT ((0)) FOR `forward_request_querystrings`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF__uri_respo__activ__1E1D39E1`  DEFAULT ((0)) FOR `active`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF_uri_responses_flagged_for_deletion1`  DEFAULT ((0)) FOR `flagged_for_deletion`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF_uri_responses_date_inserted1`  DEFAULT (utc_timestamp()) FOR `date_inserted`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` ADD  CONSTRAINT `DF_uri_responses_date_last_updated1`  DEFAULT (utc_timestamp()) FOR `date_last_updated`
GO
ALTER TABLE `dbo`.`uri_responses`  WITH CHECK ADD  CONSTRAINT `FK_uri_responses_uri_requests` FOREIGN KEY(`uri_entry_id`)
REFERENCES [dbo].[uri_entries] (`uri_entry_id`)
ON DELETE CASCADE
GO
ALTER TABLE `dbo`.`uri_responses` CHECK CONSTRAINT `FK_uri_responses_uri_requests`
GO
ALTER TABLE `dbo`.`uri_responses_prevalid`  WITH CHECK ADD  CONSTRAINT `FK_uri_responses_prevalid_uri_entries_prevalid` FOREIGN KEY(`uri_entry_id`)
REFERENCES [dbo].[uri_entries_prevalid] (`uri_entry_id`)
ON DELETE CASCADE
GO
ALTER TABLE `dbo`.`uri_responses_prevalid` CHECK CONSTRAINT `FK_uri_responses_prevalid_uri_entries_prevalid`
GO
/****** Object:  StoredProcedure [dbo].[ADMIN_DELETE_Account]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 09-JUN-2020
-- Description:	[ADMIN_DELETE_Account] removes an unauthorised account from the database
-- =============================================
        DELIMITER //

CREATE PROCEDURE ADMIN_DELETE_Account (
    p_var_member_primary_gln NChar(23),
    p_var_account_name nvarchar(255),
    p_var_authentication_key nvarchar(64))
BEGIN

    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_success_flag bit = 0

    DELETE
    FROM resolver_auth
    WHERE member_primary_gln = p_var_member_primary_gln
      AND account_name = p_var_account_name
      AND authentication_key = p_var_authentication_key;

    IF FOUND_ROWS() > 0 THEN
        SET @var_success_flag = 1;
END IF;

SELECT @var_success_flag as SUCCESS;
END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[ADMIN_DELETE_Build_Server_From_Sync_Register]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Date:        09-06-2020
-- Description: Deletes the requested build server from the heard list (which will trigger the build server
--              to rebuild its data store from scratch
-- =============================================
        DELIMITER //

CREATE PROCEDURE ADMIN_DELETE_Build_Server_From_Sync_Register (
    p_var_sync_server_id NChar(12))
BEGIN
    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_success_flag bit = 0

    DELETE
    FROM server_sync_register
    WHERE resolver_sync_server_id = p_var_sync_server_id;

    IF FOUND_ROWS() > 0
        THEN
        SET @var_success_flag = 1;
END IF;

SELECT @var_success_flag as SUCCESS;
END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[ADMIN_GET_Accounts]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 09-JUN-2020
-- Description:	Lists the authenticated accounts in this database
-- =============================================
        DELIMITER //

CREATE PROCEDURE ADMIN_GET_Accounts()

BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.

    SELECT
        `member_primary_gln`,
        `account_name`,
        `authentication_key`
    FROM resolver_auth
    ORDER BY `member_primary_gln`, `account_name`;
END;
    //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[ADMIN_GET_Heard_Build_Servers]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 09-06-2020
-- Description:	Lists the Build servers synchronising with this database
-- =============================================
            DELIMITER //

    CREATE PROCEDURE ADMIN_GET_Heard_Build_Servers()

    BEGIN
        -- SET NOCOUNT ON added to prevent extra result sets from
        -- interfering with SELECT statements.

        SELECT
            `resolver_sync_server_id`,
            `resolver_sync_server_hostname`,
            `last_heard_datetime`
        FROM server_sync_register
        ORDER BY `last_heard_datetime` DESC;
    END;
        //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[ADMIN_UPSERT_Account]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	[ADMIN_UPSERT_Account] UPdates or inSERTs an authorised account
--              with authentication key accepted by the API
-- =============================================
                DELIMITER //

        CREATE PROCEDURE ADMIN_UPSERT_Account (
            p_var_member_primary_gln NChar(23),
            p_var_account_name nvarchar(255),
            p_var_authentication_key nvarchar(64))
        BEGIN
            SET  XACT_ABORT  ON
            SET  NOCOUNT  ON

            DECLARE @var_success_flag bit = 0
            DECLARE v_count INT DEFAULT 0;
            DECLARE v_auth_id BigInt DEFAULT 0;


            /* See if we can find the entry already in the live uri_entries table */
            SELECT auth_id INTO v_auth_id
            FROM resolver_auth
            WHERE member_primary_gln = p_var_member_primary_gln
              AND account_name = p_var_account_name
              AND authentication_key = p_var_authentication_key;


            /* should @auth_id become null, set it back to 0 */
            SET v_auth_id = IFNULL(v_auth_id, 0);

            IF v_auth_id = 0
                THEN
                /* insert a new record */
                INSERT INTO resolver_auth
                (
                    `member_primary_gln`,
                    `account_name`,
                    `authentication_key`
                )
                VALUES
                (
                    p_var_member_primary_gln,
                    p_var_account_name,
                    p_var_authentication_key
                );

            /* If the undert was successful, rowcount will be > 0 */
            IF FOUND_ROWS() > 0 THEN
                SET @var_success_flag = 1;
        END IF;
ELSE
            /* Update an existing record in the [resolver_auth] table */
UPDATE resolver_auth
SET	`member_primary_gln` = p_var_member_primary_gln,
    `account_name` = p_var_account_name,
    `authentication_key` = p_var_authentication_key
WHERE auth_id = v_auth_id;

IF FOUND_ROWS() > 0 THEN
    SET @var_success_flag = 1;
END IF;

END IF;

SELECT @var_success_flag AS SUCCESS;
END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[BUILD_Get_GCP_Redirects]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 14-04-2020
-- Description:	Gets all the GCP redirects staring at a given lowest redirect_id (default 0) and batch size (default 1000)
--              Which is used by the BUILD application to rebuild its local document database from scratch / perform a full sync.

-- =============================================
        DELIMITER //

CREATE PROCEDURE BUILD_Get_GCP_Redirects (
    p_var_last_heard_datetime  nvarchar(30),
    p_var_lowest_gcp_redirect_id bigint /* = 0 */,
    p_var_max_rows_to_return int /* = 1000 */)
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DECLARE @last_heard datetime = CONVERT(p_var_last_heard_datetime, DATETIME)

    SET p_var_max_rows_to_return = IFNULL(p_var_max_rows_to_return, 1000);

    SELECT TOP (@var_max_rows_to_return)
        gcp_redirect_id,
        member_primary_gln,
        identification_key_type,
        prefix_value,
        target_url,
        active
    FROM gcp_redirects
    WHERE gcp_redirect_id >= p_var_lowest_gcp_redirect_id
      AND date_last_updated > @last_heard
    ORDER BY gcp_redirect_id;

END;
    //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[BUILD_Get_URI_Entries]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 24-FEB-2020
-- Description:	Gets all the URI entries staring at a given lowest entry_id (default 0) and batch size (default 1000) for a given last heard date time
--              Which is used by the BUILD application to rebuild its local document database from scratch / perform a full sync.
-- =============================================
            DELIMITER //

    CREATE PROCEDURE BUILD_Get_URI_Entries
    (
        p_var_last_heard_datetime nvarchar(30),
        p_var_lowest_entry_id bigint /* = 0 */,
        p_var_max_rows_to_return int /* = 1000 */
    )
    BEGIN

        SET  XACT_ABORT  ON

        SET  NOCOUNT  ON

        DECLARE @last_heard datetime = CONVERT(p_var_last_heard_datetime, DATETIME)

        SET p_var_max_rows_to_return = IFNULL(p_var_max_rows_to_return, 1000);

        SELECT TOP (@var_max_rows_to_return)
            uri_entry_id,
            member_primary_gln,
            identification_key_type,
            identification_key,
            item_description,
            date_inserted,
            date_last_updated,
            qualifier_path,
            active
        FROM uri_entries
        WHERE uri_entry_id >= p_var_lowest_entry_id
          AND date_last_updated > @last_heard
        ORDER BY uri_entry_id;

    END;
        //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[BUILD_GET_URI_entries_using_identification_key]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-Feb-2020
-- Description:	Used by the Build process to get URI entries based on the supplied gs1 key code and value
-- =============================================
                DELIMITER //

        CREATE PROCEDURE BUILD_GET_URI_entries_using_identification_key (
            p_var_identification_key_type nvarchar(20),
            p_var_identification_key nvarchar(45))
        BEGIN
            -- SET NOCOUNT ON added to prevent extra result sets from
            -- interfering with SELECT statements.


            SELECT
                `uri_entry_id`,
                `member_primary_gln`,
                `identification_key_type`,
                `identification_key`,
                `item_description`,
                `date_inserted`,
                `date_last_updated`,
                `qualifier_path`,
                `active`
            FROM uri_entries
            WHERE identification_key_type = p_var_identification_key_type
              AND identification_key = p_var_identification_key
              AND flagged_for_deletion = 0;

        END;
            //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[BUILD_Register_Sync_Server]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 24-FEB-2020
-- Description:	The BUILD application in each resolver 'logs in' to this database my registering its unique server-id (generated
--              from the Docker Engine-provided 12-character hostname. This procedure inserts or updates this server-id's entry
--              and updates its 'last heard' data time, then responds with the previously heard date time.
--              This enables the Build process to just get those entries changed since that date time.
--              2020-01-01 is the earliest date before any resolver entry. If this server syncs fror thr dirt time, that
--              value is the one returned.
-- =============================================
                    DELIMITER //

            CREATE PROCEDURE BUILD_Register_Sync_Server (
                p_sync_server_id NCHAR(12),
                p_sync_server_hostname NVARCHAR(100) /* = '(UNKNOWN)' */)
            BEGIN

                SET  XACT_ABORT  ON

                SET  NOCOUNT  ON

                DECLARE @last_heard_datetime DATETIME

                SELECT last_heard_datetime INTO @last_heard_datetime
                FROM server_sync_register
                WHERE resolver_sync_server_id = p_sync_server_id;

                IF @last_heard_datetime iS NULL
                    THEN
                    INSERT INTO server_sync_register
                    (
                        resolver_sync_server_id,
                        resolver_sync_server_hostname,
                        last_heard_datetime
                    )
                    VALUES
                    (
                        p_sync_server_id,
                        p_sync_server_hostname,
                        UTC_TIMESTAMP()
                    );

                SET @last_heard_datetime = STR_TO_DATE('2020-01-01', 102);

ELSE


UPDATE server_sync_register
SET last_heard_datetime = UTC_TIMESTAMP(),
    resolver_sync_server_hostname = p_sync_server_hostname
WHERE resolver_sync_server_id = p_sync_server_id;

END IF;

SELECT
    @last_heard_datetime AS last_heard_datetime;
END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[COUNT_URI_Entries_using_member_primary_gln]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-Apr-2020
-- Description:	[COUNT_URI_Entries_using_member_primary_gln] counts the URI entries and returns a count
--              of records matching @var_member_primary_gln
-- =============================================
        DELIMITER //

CREATE PROCEDURE COUNT_URI_Entries_using_member_primary_gln (
    p_var_member_primary_gln nchar(13))
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.

    SELECT
        COUNT(*) as entry_count
    FROM uri_entries
    WHERE member_primary_gln = p_var_member_primary_gln
      AND flagged_for_deletion = 0;

END;
    //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[DELETE_GCP_Redirect]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 05-JUN-2020
-- Description:	DELETE_GCP_Redirect sets flagged_for_deletion = 1 and active = 1 for the supplied GCP
--              This does not delete the record, but flags it for deletion by a later end-of-day process.
-- =============================================
            DELIMITER //

    CREATE PROCEDURE DELETE_GCP_Redirect (
        p_var_member_primary_gln NCHAR(13),
        p_var_identification_key_type NVarCHar(20),
        p_var_prefix_value NVARCHAR(45))
    BEGIN

        SET  XACT_ABORT  ON
        SET  NOCOUNT  ON

        DECLARE @var_success_flag bit = 0

            START TRANSACTION;

        UPDATE gcp_redirects
        SET flagged_for_deletion = 1,
            active = 0,
            date_last_updated = NOW()
        WHERE member_primary_gln = p_var_member_primary_gln
          AND identification_key_type = p_var_identification_key_type
          AND prefix_value = p_var_prefix_value;

        IF FOUND_ROWS() > 0
            THEN
            SET @var_success_flag = 1;
    END IF;

        COMMIT ;

    SELECT @var_success_flag as SUCCESS;
END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[DELETE_URI_Entry]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-FEB-2020
-- Description:	DELETE_URI_Entry sets the 'flagged_for_deletion' column to 1 and active to 0 for the supplied entry and all of its responses.
--              In the meantime, this entry will be removed from MongoDB as active is now 0 and the Build application
--              will read this row since date_last_updated is updated to right now.
--              This does not delete the record, but flags it for deletion by a later end-of-day process.
-- =============================================
        DELIMITER //

CREATE PROCEDURE DELETE_URI_Entry (
    p_var_member_primary_gln nchar(13),
    p_var_identification_key_type nvarchar(20),
    p_var_identification_key nvarchar(45))
BEGIN

    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_success_flag bit = 0


    /* Update the uri_responses_table */
    UPDATE uri_responses
    SET flagged_for_deletion = 1, active = 0, date_last_updated = NOW()
    WHERE uri_entry_id IN
          (
              SELECT uri_entry_id
              FROM uri_entries
              WHERE identification_key_type = p_var_identification_key_type
                AND identification_key = p_var_identification_key
                AND member_primary_gln = p_var_member_primary_gln
          );


    /* Update the uri_entries_table */
    UPDATE uri_entries
    SET flagged_for_deletion = 1, active = 0, date_last_updated = NOW()
    WHERE identification_key_type = p_var_identification_key_type
      AND identification_key = p_var_identification_key
      AND member_primary_gln = p_var_member_primary_gln;

    IF FOUND_ROWS() > 0
        THEN
        SET @var_success_flag = 1;
END IF;

SELECT @var_success_flag as SUCCESS;
END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[END_OF_DAY]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 2020-06-08
-- Description:	END-OF-DAY Master Routine
-- =============================================
        DELIMITER //

CREATE PROCEDURE END_OF_DAY()
BEGIN

            CALL ENDOFDAY_Delete_Flagged_URI_Entries_Prevalid;;
            CALL ENDOFDAY_Delete_Flagged_URI_Entries;;
            CALL ENDOFDAY_Delete_Flagged_GCP_Entries;;
END;
    //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[ENDOFDAY_Delete_Flagged_GCP_Entries]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 21-FEB-2020
-- Description: SQL DELETES all GCP entries flagged for deletion
-- =============================================
            DELIMITER //

    CREATE PROCEDURE ENDOFDAY_Delete_Flagged_GCP_Entries()
    BEGIN
        -- SET NOCOUNT ON added to prevent extra result sets from
        -- interfering with SELECT statements.

        DELETE FROM gcp_redirects
        WHERE active = 0
          AND TIMESTAMPDIFF(HOUR, date_last_updated, NOW()) > 24;

    END;
        //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[ENDOFDAY_Delete_Flagged_URI_Entries]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 21-FEB-2020
-- Description: SQL DELETES all URI entries flagged for deletion for more than 24 hours
--              and where active is set to 0. If active was still set to 1
--              the data would not be removed from the Mongo DB.
-- =============================================
                DELIMITER //

        CREATE PROCEDURE ENDOFDAY_Delete_Flagged_URI_Entries()
        BEGIN
            -- SET NOCOUNT ON added to prevent extra result sets from
            -- interfering with SELECT statements.

            DELETE FROM uri_entries
            WHERE flagged_for_deletion = 1
              AND active = 0
              AND TIMESTAMPDIFF(HOUR, date_last_updated, NOW()) > 24;
        END;
            //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[ENDOFDAY_Delete_Flagged_URI_Entries_Prevalid]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 21-FEB-2020
-- Description: SQL DELETES all URI entries in the Prevalid flagged for deletion
--              AND that are over a day old, so that clients have up to 24 hours
--              to pick up their pending / completed batch results
-- =============================================
                    DELIMITER //

            CREATE PROCEDURE ENDOFDAY_Delete_Flagged_URI_Entries_Prevalid()
            BEGIN
                -- SET NOCOUNT ON added to prevent extra result sets from
                -- interfering with SELECT statements.

                DELETE FROM uri_entries_prevalid
                WHERE flagged_for_deletion = 1
                  AND TIMESTAMPDIFF(HOUR, date_last_updated, NOW()) > 24;


            END;



                //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[GET_GCP_Redirects]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 05-JUN-2020
-- Description:	Returns all the GCP Redirect entries for the supplied member's primary GLN
-- =============================================
                        DELIMITER //

                CREATE PROCEDURE GET_GCP_Redirects (
                    p_var_member_primary_gln NCHAR(13))
                BEGIN

                    SELECT identification_key_type,
                           prefix_value,
                           target_url,
                           active
                    FROM gcp_redirects
                    WHERE member_primary_gln = p_var_member_primary_gln
                      AND flagged_for_deletion = 0
                    ORDER BY prefix_value;

                END;
                    //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[GET_URI_Entries_using_gln_and_identification_key]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-Feb-2020
-- Description:	[GET_URI_Entries_using_gln_and_identification_key_type_and_value]
--               searches for the URI entrys based on the supplied gln, gs1 key code and value
-- =============================================
                            DELIMITER //

                    CREATE PROCEDURE GET_URI_Entries_using_gln_and_identification_key (
                        p_var_identification_key_type nvarchar(20),
                        p_var_identification_key nvarchar(45),
                        p_var_member_primary_gln nchar(13))
                    BEGIN
                        -- SET NOCOUNT ON added to prevent extra result sets from
                        -- interfering with SELECT statements.


                        SELECT
                            `uri_entry_id`,
                            `member_primary_gln`,
                            `identification_key_type`,
                            `identification_key`,
                            `item_description`,
                            `date_inserted`,
                            `date_last_updated`,
                            `qualifier_path`,
                            `active`
                        FROM uri_entries
                        WHERE identification_key_type = p_var_identification_key_type
                          AND identification_key = p_var_identification_key
                          AND member_primary_gln = p_var_member_primary_gln
                          AND flagged_for_deletion = 0;

                    END;
                        //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[GET_URI_Entries_using_identification_key]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-Feb-2020
-- Description:	[GET_URI_Entries_using_identification_key] searches for the URI entrys based on the supplied identification key and type
-- =============================================
                                DELIMITER //

                        CREATE PROCEDURE GET_URI_Entries_using_identification_key (
                            p_var_identification_key_type nvarchar(20),
                            p_var_identification_key nvarchar(45),
                            p_var_member_primary_gln nchar(13))
                        BEGIN
                            -- SET NOCOUNT ON added to prevent extra result sets from
                            -- interfering with SELECT statements.

                            SELECT
                                `uri_entry_id`,
                                `member_primary_gln`,
                                `identification_key_type`,
                                `identification_key`,
                                `item_description`,
                                `date_inserted`,
                                `date_last_updated`,
                                `qualifier_path`,
                                `active`
                            FROM uri_entries
                            WHERE identification_key_type = p_var_identification_key_type
                              AND identification_key = p_var_identification_key
                              AND member_primary_gln = p_var_member_primary_gln
                              AND flagged_for_deletion = 0;

                        END;
                            //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[GET_URI_Entries_using_member_primary_gln]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-Feb-2020
-- Description:	[GET_URI_Entries_using_member_primary_gln] searches for the URI entries based on the supplied member_primary_gln
--              and SQL's paging capability, allowing clients to read the data in batches.
-- =============================================
                                    DELIMITER //

                            CREATE PROCEDURE GET_URI_Entries_using_member_primary_gln (
                                p_var_member_primary_gln nchar(13),
                                p_var_page_number INT /* = 1 */,
                                p_var_page_size INT /* = 1000 */)
                            BEGIN
                                -- SET NOCOUNT ON added to prevent extra result sets from
                                -- interfering with SELECT statements.

                                SELECT
                                    `uri_entry_id`,
                                    `member_primary_gln`,
                                    `identification_key_type`,
                                    `identification_key`,
                                    `item_description`,
                                    `date_inserted`,
                                    `date_last_updated`,
                                    `qualifier_path`,
                                    `active`
                                FROM uri_entries
                                WHERE member_primary_gln = p_var_member_primary_gln
                                  AND flagged_for_deletion = 0
                                ORDER BY identification_key;
                                        OFFSET p_var_page_size * (p_var_page_number - 1) ROWS
                                FETCH NEXT v_var_page_size; ROWS ONLY;

                            END;
                                //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[GET_URI_Responses]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-FEB-2020
-- Description:	SEARCH_UI_Responses__uri_entry_id finds all the responses for a particular entry, and returns them
--              oreded by  linktype, iana_language, context, and mime_type
-- =============================================
                                        DELIMITER //

                                CREATE PROCEDURE GET_URI_Responses (
                                    p_var_uri_entry_id bigint)
                                BEGIN

                                    SET  XACT_ABORT  ON

                                    SET  NOCOUNT  ON

                                    SELECT
                                        linktype,
                                        iana_language,
                                        context,
                                        mime_type,
                                        link_title,
                                        target_url,
                                        default_linktype,
                                        default_iana_language,
                                        default_context,
                                        default_mime_type,
                                        forward_request_querystrings,
                                        active
                                    FROM uri_responses
                                    WHERE uri_entry_id = p_var_uri_entry_id
                                      AND flagged_for_deletion = 0
                                    ORDER BY linktype, iana_language, context, mime_type

                                END;
                                    //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[INTERNAL_Ensure_Entry_Has_Active_Responses]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 26-FEB-2020
-- Description:	We must check if there is at least one responses with active = 1 (and not flagged for deletion)
-- for the associated entry. If not, the entry has no active responses so must have its active flag set to 0 */
-- A Entry cannot be active unless it has at least one active Response.
-- =============================================
                                            DELIMITER //

                                    CREATE PROCEDURE INTERNAL_Ensure_Entry_Has_Active_Responses (
                                        p_var_uri_entry_id bigint)
                                    BEGIN
                                        DECLARE v_var_count INT DEFAULT 0;

                                        SELECT COUNT(*) INTO v_var_count
                                        FROM uri_responses
                                        WHERE uri_entry_id = p_var_uri_entry_id
                                          AND active = 1 AND flagged_for_deletion = 0;

                                        IF v_var_count = 0 THEN
                                            UPDATE uri_entries
                                            SET active = 0
                                            WHERE uri_entry_id = p_var_uri_entry_id;
                                    END IF;
END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[READ_GCP_Redirect]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 20-FEB-2020
-- Description:	Reads the GCP Redirect entry
-- =============================================
        DELIMITER //

CREATE PROCEDURE READ_GCP_Redirect (
    p_var_member_primary_gln NCHAR(13),
    p_var_identification_key_type NVarCHar(20),
    p_var_prefix_value NVARCHAR(45))
BEGIN

    SELECT identification_key_type,
           prefix_value,
           target_url,
           active
    FROM gcp_redirects
    WHERE member_primary_gln = p_var_member_primary_gln
      AND identification_key_type = p_var_identification_key_type
      AND prefix_value = p_var_prefix_value
      AND flagged_for_deletion = 0;

END;
    //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[READ_Resolver_Auth]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:      Nick Lansley
-- Create Date: 17 March 2020
-- Description: Checks the authentication key of an incoming entry
--              Temporary authentication which should be replaced by a more robust service
-- =============================================
            DELIMITER //

    CREATE PROCEDURE READ_Resolver_Auth
    (
        p_varAuthKey nvarchar(64)
    )
    BEGIN
        -- SET NOCOUNT ON added to prevent extra result sets from
        -- interfering with SELECT statements.

        SELECT
            COUNT(*) AS success,
            min(member_primary_gln) AS member_primary_gln
        FROM resolver_auth
        WHERE authentication_key = p_varAuthKey;


    END;
        //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[READ_URI_Entry]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-Feb-2020
-- Description:	READ_URI_Entry reads the URI entry record based on the supplied uri_entry_id
-- =============================================
                DELIMITER //

        CREATE PROCEDURE READ_URI_Entry (
            p_var_uri_entry_id bigint,
            p_var_member_primary_gln nchar(13))
        BEGIN
            -- SET NOCOUNT ON added to prevent extra result sets from
            -- interfering with SELECT statements.


            SELECT `uri_entry_id`,
                `member_primary_gln`,
                `identification_key_type`,
                `identification_key`,
                `item_description`,
                `date_inserted`,
                `date_last_updated`,
                `qualifier_path`,
                `active`
            FROM uri_entries
            WHERE uri_entry_id = p_var_uri_entry_id
              AND member_primary_gln = p_var_member_primary_gln
              AND flagged_for_deletion = 0;


        END;
            //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[READ_URI_Response]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-FEB-2020
-- Description:	READ_URI_Response reads the response for a given uri_response_id
-- =============================================
                    DELIMITER //

            CREATE PROCEDURE READ_URI_Response (
                p_var_uri_response_id bigint)
            BEGIN

                SET  XACT_ABORT  ON

                SET  NOCOUNT  ON

                SELECT
                    uri_response_id,
                    uri_entry_id,
                    linktype,
                    iana_language,
                    context,
                    mime_type,
                    link_title,
                    target_url,
                    default_linktype,
                    default_iana_language,
                    default_context,
                    default_mime_type,
                    forward_request_querystrings,
                    active
                FROM uri_responses
                WHERE uri_response_id = p_var_uri_response_id
                  AND flagged_for_deletion = 0

            END;
                //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[UPSERT_GCP_Redirect]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 05-JUN-2020
-- Description:	Inserts or updates a new or existing GCP Redirect
-- =============================================
                        DELIMITER //

                CREATE PROCEDURE UPSERT_GCP_Redirect (
                    p_var_member_primary_gln nchar(13),
                    p_var_identification_key_type nvarchar(20),
                    p_var_prefix_value nvarchar(45),
                    p_var_target_url nvarchar(255),
                    p_var_active tinyint)
                BEGIN

                    DECLARE v_var_gcp_redirect_id bigint DEFAULT 0;
                    DECLARE v_var_success_flag tinyint DEFAULT 0;


                    /* Find out if that key code and value combination already exists */

                    SELECT gcp_redirect_id INTO v_var_gcp_redirect_id
                    FROM gcp_redirects
                    WHERE identification_key_type = p_var_identification_key_type
                      AND prefix_value = p_var_prefix_value;

                    /* If no rows come back, @var_gcp_redirect_id may become NULL
                     in which case we need to get it back to 0 */
                    SET v_var_gcp_redirect_id = IFNULL(v_var_gcp_redirect_id, 0);

                    IF v_var_gcp_redirect_id = 0
                        THEN
                        INSERT INTO gcp_redirects
                        (
                            member_primary_gln,
                            identification_key_type,
                            prefix_value,
                            target_url,
                            active,
                            flagged_for_deletion,
                            date_inserted,
                            date_last_updated
                        )
                        VALUES
                        (
                            p_var_member_primary_gln,
                            p_var_identification_key_type,
                            p_var_prefix_value,
                            p_var_target_url,
                            p_var_active,
                            0,
                            UTC_TIMESTAMP(),
                            UTC_TIMESTAMP()
                        );

                    SET v_var_gcp_redirect_id = LAST_INSERT_ID();


ELSE
        /* Find the existing gcp_redirect_id value and update the record */

UPDATE gcp_redirects
SET member_primary_gln = p_var_member_primary_gln,
    identification_key_type = p_var_identification_key_type,
    prefix_value = p_var_prefix_value,
    target_url = p_var_target_url,
    active  = p_var_active,
    flagged_for_deletion = 0,
    date_last_updated = UTC_TIMESTAMP()
WHERE identification_key_type = p_var_identification_key_type
  AND prefix_value = p_var_prefix_value;

IF FOUND_ROWS() > 0 THEN
    SET v_var_success_flag = 1;
END IF;

/* return the new gcp_redirect_id (or the updated gcp_redirect_id). */
SELECT v_var_gcp_redirect_id AS gcp_redirect_id, CONVERT(bit, 1); AS SUCCESS

END IF;
END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[UPSERT_URI_Entry]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	[UPSERT_URI_Entry] UPdates or inSERTs a URI response
--              into the uri_entries table.
--              It is used by VALIDATE_Publish_Validated_Entries procedure.
-- =============================================
        DELIMITER //

CREATE PROCEDURE UPSERT_URI_Entry (
    p_var_member_primary_gln nchar(13),
    p_var_identification_key_type nvarchar(20),
    p_var_identification_key nvarchar(45),
    p_var_item_description nvarchar(200),
    p_var_qualifier_path nvarchar(255),
    p_var_active tinyint,
    p_var_output_uri_entry_id OUT BigInt )
BEGIN

    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_success_flag bit = 0
    DECLARE v_count INT DEFAULT 0;

    /* As @var_output_uri_entry_id is an INPUT/OUTPUT variable, its value from a previous
       call by the calling procedure (which is looping) may come back in, so clear it zero */
    SET p_var_output_uri_entry_id = 0;

    /* See if we can find the entry already in the live uri_entries table */
    SELECT uri_entry_id INTO p_var_output_uri_entry_id
    FROM uri_entries
    WHERE member_primary_gln = p_var_member_primary_gln
      AND identification_key_type = p_var_identification_key_type
      AND identification_key = p_var_identification_key
      AND qualifier_path = p_var_qualifier_path;


    /* should var_output_uri_entry_id become null, set it back to 0 */
    SET p_var_output_uri_entry_id = IFNULL(p_var_output_uri_entry_id, 0);

    IF p_var_output_uri_entry_id = 0
        THEN
        /* insert a new record */
        INSERT INTO uri_entries
        (
            `member_primary_gln`,
            `identification_key_type`,
            `identification_key`,
            `item_description`,
            `date_inserted`,
            `date_last_updated`,
            `qualifier_path`,
            `active`,
            `flagged_for_deletion`
        )
        VALUES
        (
            p_var_member_primary_gln,
            p_var_identification_key_type,
            p_var_identification_key,
            p_var_item_description,
            UTC_TIMESTAMP(),
            UTC_TIMESTAMP(),
            p_var_qualifier_path,
            p_var_active,
            0 /* flagged_for_deletion set to 0 (false) */
        );


    /* store the new uri_entry_id from the IDENTITY as the record is inserted */
    SET p_var_output_uri_entry_id = LAST_INSERT_ID();

ELSE
            /* Update an existing record in the [uri_entries] table */
UPDATE uri_entries
SET	member_primary_gln = p_var_member_primary_gln,
       identification_key_type = p_var_identification_key_type,
       identification_key = p_var_identification_key,
       item_description = p_var_item_description,
       date_last_updated = utc_timestamp(),
       qualifier_path = p_var_qualifier_path,
       active = p_var_active,
       flagged_for_deletion = 0
WHERE uri_entry_id = p_var_output_uri_entry_id;

IF FOUND_ROWS() > 0 THEN
    SET @var_success_flag = 1;
END IF;

END IF;

END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[UPSERT_URI_Entry_Prevalid]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	[UPSERT_URI_Entry_Prevalid]UPdates or inSERTs a URI response
--              into the uri_entries_prevalid table
-- =============================================
        DELIMITER //

CREATE PROCEDURE UPSERT_URI_Entry_Prevalid (
    p_var_member_primary_gln nchar(13),
    p_var_identification_key_type nvarchar(20),
    p_var_identification_key nvarchar(45),
    p_var_item_description nvarchar(200),
    p_var_qualifier_path nvarchar(255),
    p_var_active tinyint,
    p_var_batch_id int /* = 0 */,
    p_var_validation_code tinyint unsigned /* = 0 */)
BEGIN

    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_uri_entry_id bigint = 0
    DECLARE v_var_success_flag tinyint DEFAULT 0;
    DECLARE v_count INT DEFAULT 0;

    SELECT uri_entry_id INTO @var_uri_entry_id
    FROM uri_entries_prevalid
    WHERE member_primary_gln = p_var_member_primary_gln
      AND identification_key_type = p_var_identification_key_type
      AND identification_key = p_var_identification_key
      AND qualifier_path = p_var_qualifier_path;

    /* If no rows come back, @@var_uri_entry_id may become NULL
    in which case we need to get it back to 0 */
    SET @var_uri_entry_id = IFNULL(@var_uri_entry_id, 0);


    IF @var_uri_entry_id = 0
        THEN
        /* insert a new record */
        INSERT INTO uri_entries_prevalid
        (
            `member_primary_gln`,
            `identification_key_type`,
            `identification_key`,
            `item_description`,
            `date_inserted`,
            `date_last_updated`,
            `qualifier_path`,
            `active`,
            `flagged_for_deletion`,
            `validation_code`,
            `batch_id`
        )
        VALUES
        (
            p_var_member_primary_gln,
            p_var_identification_key_type,
            p_var_identification_key,
            p_var_item_description,
            UTC_TIMESTAMP(),
            UTC_TIMESTAMP(),
            p_var_qualifier_path,
            p_var_active,
            0, /* flagged_for_deletion set to 0 (false) */
            p_var_validation_code,
            p_var_batch_id
        );


    /* store the entry id from the IDENTITY as the record is inserted */
    SET @var_uri_entry_id = LAST_INSERT_ID();

    /* return the new uri_entry_id (or the updated uri_entry_id). */
    SELECT @var_uri_entry_id AS  uri_entry_id, CONVERT(bit, 1); AS SUCCESS

ELSE
            /* Update an existing record in the prevalid table */

UPDATE uri_entries_prevalid
SET	member_primary_gln = p_var_member_primary_gln,
       identification_key_type = p_var_identification_key_type,
       identification_key = p_var_identification_key,
       item_description = p_var_item_description,
       date_last_updated = utc_timestamp(),
       qualifier_path = p_var_qualifier_path,
       active = p_var_active,
       flagged_for_deletion = 0,
       validation_code = p_var_validation_code,
       batch_id = p_var_batch_id
WHERE uri_entry_id = @var_uri_entry_id;

IF FOUND_ROWS() > 0 THEN
    SET v_var_success_flag = 1;
END IF;

SELECT @var_uri_entry_id AS uri_entry_id, v_var_success_flag as SUCCESS;
END IF;

END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[UPSERT_URI_Response]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	[UPSERT_URI_Response] UPdates or inSERTs a new URI response
--              into the uri_responses table.
--              This is executed by the VALIDATE_Publish_Validated_Responses procedure.
-- =============================================
        DELIMITER //

CREATE PROCEDURE UPSERT_URI_Response (
    p_var_uri_entry_id_published bigint,
    p_var_linktype nvarchar(100),
    p_var_iana_language nchar(2),
    p_var_context nvarchar(100),
    p_var_mime_type nvarchar(45),
    p_var_link_title nvarchar(45),
    p_var_target_url nvarchar(1024),
    p_var_default_linktype tinyint,
    p_var_default_iana_language tinyint,
    p_var_default_context tinyint,
    p_var_default_mime_type tinyint,
    p_var_forward_request_querystrings tinyint,
    p_var_active tinyint)
BEGIN

    /*
                @var_uri_entry_id_published,
            @var_linktype,
            @var_iana_language,
            @var_context,
            @var_mime_type,
            @var_link_title,
            @var_target_url,
            @var_default_linktype,
            @var_default_iana_language,
            @var_default_context,
            @var_default_mime_type,
            @var_forward_request_querystrings,
            @var_active
    */

    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_uri_response_id bigint = 0
    DECLARE v_var_success_flag tinyint DEFAULT 0;


    /* find out if this entry already exists using the unique
	   combination of entry_id, linktype, langiage, context and mime_type.
	   Using MIN() is just a 'one row back only' safety feature */
    SELECT MIN(uri_response_id) INTO @var_uri_response_id
    FROM uri_responses
    WHERE uri_entry_id = p_var_uri_entry_id_published
      AND linktype = p_var_linktype
      AND iana_language = p_var_iana_language
      AND context = p_var_context
      AND mime_type = p_var_mime_type;


    /* if @var_uri_response_id has become NULL put it back to 0 */
    SET @var_uri_response_id = IFNULL(@var_uri_response_id, 0);

    /* If count = 0 then insert else update */
    IF @var_uri_response_id = 0
        THEN
        INSERT INTO uri_responses
        (
            uri_entry_id,
            linktype,
            iana_language,
            context,
            mime_type,
            link_title,
            target_url,
            default_linktype,
            default_iana_language,
            default_context,
            default_mime_type,
            forward_request_querystrings,
            active,
            flagged_for_deletion,
            date_inserted,
            date_last_updated
        )
        VALUES
        (
            p_var_uri_entry_id_published,
            p_var_linktype,
            p_var_iana_language,
            p_var_context,
            p_var_mime_type,
            p_var_link_title,
            p_var_target_url,
            p_var_default_linktype,
            p_var_default_iana_language,
            p_var_default_context,
            p_var_default_mime_type,
            p_var_forward_request_querystrings,
            p_var_active,
            0,
            UTC_TIMESTAMP(),
            UTC_TIMESTAMP()
        );

    /* return the entry id from the IDENTITY as the record is inserte */
    SET @var_uri_response_id = LAST_INSERT_ID();
ELSE
            /* Update is required */
UPDATE uri_responses
SET uri_entry_id = p_var_uri_entry_id_published,
    linktype = p_var_linktype,
    iana_language = p_var_iana_language,
    target_url = p_var_target_url,
    context = p_var_context,
    mime_type = p_var_mime_type,
    link_title = p_var_link_title,
    forward_request_querystrings = p_var_forward_request_querystrings,
    active = p_var_active,
    flagged_for_deletion = 0,
    default_linktype = p_var_default_linktype,
    default_iana_language = p_var_default_iana_language,
    default_context = p_var_default_context,
    default_mime_type = p_var_default_mime_type,
    date_last_updated = UTC_TIMESTAMP()
WHERE uri_response_id = @var_uri_response_id;

IF FOUND_ROWS() > 0
    THEN
    SET v_var_success_flag = 1;
END IF;
END IF;


END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[UPSERT_URI_Response_Prevalid]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	[UPSERT_URI_Response_Prevalid] UPdates or inSERTs a new URI response
--              into the uri_responses_prevalid table
-- =============================================
        DELIMITER //

CREATE PROCEDURE UPSERT_URI_Response_Prevalid (
    p_var_uri_entry_id bigint,
    p_var_linktype nvarchar(100),
    p_var_iana_language nchar(2),
    p_var_context nvarchar(100),
    p_var_mime_type nvarchar(45),
    p_var_link_title nvarchar(45),
    p_var_target_url nvarchar(1024),
    p_var_forward_request_querystrings tinyint,
    p_var_active tinyint,
    p_var_default_linktype tinyint,
    p_var_default_iana_language tinyint,
    p_var_default_context tinyint,
    p_var_default_mime_type tinyint)
BEGIN

    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_uri_response_id bigint = 0
    DECLARE v_var_success_flag tinyint DEFAULT 0;



    /* find out if this entry already exists */
    SELECT IFNULL(uri_response_id, 0) INTO @var_uri_response_id
    FROM uri_responses_prevalid
    WHERE uri_entry_id = p_var_uri_entry_id
      AND linktype = p_var_linktype
      AND iana_language = p_var_iana_language
      AND context = p_var_context
      AND mime_type = p_var_mime_type;

    SET @var_uri_response_id = IFNULL(@var_uri_response_id, 0);

    /* If count = 0 then insert else update */
    IF @var_uri_response_id = 0
        THEN

        INSERT INTO uri_responses_prevalid
        (
            uri_entry_id,
            linktype,
            iana_language,
            context,
            mime_type,
            link_title,
            target_url,
            default_linktype,
            default_iana_language,
            default_context,
            default_mime_type,
            forward_request_querystrings,
            active,
            flagged_for_deletion,
            date_inserted,
            date_last_updated
        )
        VALUES
        (
            p_var_uri_entry_id,
            p_var_linktype,
            p_var_iana_language,
            p_var_context,
            p_var_mime_type,
            p_var_link_title,
            p_var_target_url,
            p_var_default_linktype,
            p_var_default_iana_language,
            p_var_default_context,
            p_var_default_mime_type,
            p_var_forward_request_querystrings,
            p_var_active,
            0,
            UTC_TIMESTAMP(),
            UTC_TIMESTAMP()
        );

    /* return the entry id from the IDENTITY as the record is inserte */
    SET @var_uri_response_id = LAST_INSERT_ID();

    /* Return the new uri_response_id */
    SELECT @var_uri_response_id as uri_response_id, CONVERT(bit, 1); AS SUCCESS

ELSE

            /* Update is required */

UPDATE uri_responses_prevalid
SET uri_entry_id = p_var_uri_entry_id,
    linktype = p_var_linktype,
    iana_language = p_var_iana_language,
    target_url = p_var_target_url,
    context = p_var_context,
    mime_type = p_var_mime_type,
    link_title = p_var_link_title,
    forward_request_querystrings = p_var_forward_request_querystrings,
    active = p_var_active,
    flagged_for_deletion = 0,
    default_linktype = p_var_default_linktype,
    default_iana_language = p_var_default_iana_language,
    default_context = p_var_default_context,
    default_mime_type = p_var_default_mime_type,
    date_last_updated = UTC_TIMESTAMP()
WHERE uri_response_id = @var_uri_response_id;

IF FOUND_ROWS() > 0
    THEN
    SET v_var_success_flag = 1;
END IF;

SELECT @var_uri_response_id AS uri_response_id, v_var_success_flag as SUCCESS;
END IF;


END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[VALIDATE_Get_Batch_To_Validate]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	[VALIDATE_Get_Batch_To_Validate] starts validating entries for the provided batch_id. This procedure is
--              executed by the data entry server as soon as it has completed saving all the entries in the batch received
--              by the API into the database.
-- =============================================
        DELIMITER //

CREATE PROCEDURE VALIDATE_Get_Batch_To_Validate (
    p_batch_id int)
BEGIN


    SELECT
        `member_primary_gln`,
        `identification_key_type`,
        `identification_key`
    FROM
        uri_entries_prevalid
    WHERE batch_id = p_batch_id
      AND TIMESTAMPDIFF(DAY, `date_last_updated`, NOW()) <= 7
    ORDER BY identification_key_type, identification_key;







END;
    //

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[VALIDATE_Get_Validation_Results]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 02 June 2020
-- Description:	[VALIDATE_Get_Validation_Results] retrieves the validation results for the given batch_id
--              as long as it was issued over the previous 7 days
-- =============================================
            DELIMITER //

    CREATE PROCEDURE VALIDATE_Get_Validation_Results (
        p_var_member_primary_gln nchar(13),
        p_batch_id INT)
    BEGIN

        DECLARE v_var_unfinished_count INT DEFAULT 0;

        /* only return the results if the validation_code has been updated for every entry in the batch */
        /* Here we count how many unfinished entries there are. */
        SELECT COUNT(*) INTO v_var_unfinished_count
        FROM uri_entries_prevalid
        WHERE `batch_id` = p_batch_id
          AND `member_primary_gln` = p_var_member_primary_gln
          AND validation_code = 255
          AND TIMESTAMPDIFF(HOUR, `date_last_updated`, NOW()) <= 24;

        /* Only if there are no unfinished entries do we return results */
        IF v_var_unfinished_count = 0 THEN
            SELECT
                `identification_key_type`,
                `identification_key`,
                `validation_code`,
                'N' AS PENDING
            FROM uri_entries_prevalid
            WHERE `batch_id` = p_batch_id
              AND `member_primary_gln` = p_var_member_primary_gln
              AND validation_code < 255
              AND TIMESTAMPDIFF(HOUR, `date_last_updated`, NOW()) <= 24
            ORDER BY identification_key_type, identification_key;
        ELSE
            /* 'Fake' a single-line outpout in the same format as the results output
                so that calling code can see that this batch is still pending */
            SELECT
                'X' AS identification_key_type,
                'X' AS identification_key,
                255 AS validation_code,
                'Y' AS PENDING;
    END IF;

END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[VALIDATE_Publish_Validated_Entries]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	Copies successfully validated entries into the primary entry tables
--              in controlled batches based on the original batch_id (in code this is limited to maximum 1000 entries).
--              'Ready to copy' rows are in uri_entries_prevalid (and associated uri_responses_prevalid) table
--              where validation_code = 0 (successful validation) and the entry has not been flagged_for_deletion.
--              The entries are copied then the flagged_for_deletion flag is set to 1.
-- =============================================
        DELIMITER //

CREATE PROCEDURE VALIDATE_Publish_Validated_Entries (

    p_var_batch_id INT)
BEGIN
    DECLARE NOT_FOUND INT DEFAULT 0;

    DECLARE v_publishCount INT DEFAULT 0;

    DECLARE v_var_uri_entry_id_prevalid BigInt;
    DECLARE v_var_uri_entry_id_published BigInt;
    DECLARE v_var_member_primary_gln NChar(13);
    DECLARE v_var_identification_key_type NVarChar(20);
    DECLARE v_var_identification_key NVarChar(45);
    DECLARE v_var_item_description NVarChar(2000);
    DECLARE v_var_qualifier_path NVarChar(255);
    DECLARE v_var_active Tinyint;
    DECLARE v_flagged_for_deletion Tinyint;

    DECLARE batch_cursor CURSOR
        FOR
        SELECT
        `uri_entry_id`,
        `member_primary_gln`,
        `identification_key_type`,
        `identification_key`,
        `item_description`,
        `qualifier_path`,
        `active`,
        `flagged_for_deletion`
        FROM uri_entries_prevalid
        WHERE `flagged_for_deletion` = 0
        AND `validation_code` = 0
        AND batch_id = p_var_batch_id
        FOR
    UPDATE OF `flagged_for_deletion`


    DECLARE CONTINUE HANDLER FOR NOT FOUND SET NOT_FOUND = 1;OPEN batch_cursor;

    FETCH NEXT FROM; batch_cursor INTO
        v_var_uri_entry_id_prevalid,
		v_var_member_primary_gln,
		v_var_identification_key_type,
		v_var_identification_key,
		v_var_item_description,
		v_var_qualifier_path,
		v_var_active,
		v_flagged_for_deletion

    WHILE NOT_FOUND = 0
        DO
		CALL UPSERT_URI_Entry(
			v_var_member_primary_gln,
			v_var_identification_key_type,
			v_var_identification_key,
			v_var_item_description,
			v_var_qualifier_path,
			v_var_active,
			v_var_output_uri_entry_id); = v_var_uri_entry_id_published OUTPUT

    IF v_var_uri_entry_id_published > 0 THEN
			CALL VALIDATE_Publish_Validated_Responses( v_var_uri_entry_id_prevalid, v_var_uri_entry_id_published);
END IF;

UPDATE uri_entries_prevalid
SET `flagged_for_deletion` = 1
WHERE CURRENT OF batch_cursor;

    /* Increment counter */
    SET v_publishCount = v_publishCount + 1;

    /* fetch the next entry from the cursoer, if any */
    FETCH NEXT FROM; batch_cursor INTO
    v_var_uri_entry_id_prevalid,
			v_var_member_primary_gln,
			v_var_identification_key_type,
			v_var_identification_key,
			v_var_item_description,
			v_var_qualifier_path,
			v_var_active,
			v_flagged_for_deletion
END WHILE;

CLOSE batch_cursor;

SELECT v_publishCount as entriesPublishedCount;

END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[VALIDATE_Publish_Validated_Responses]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	Copies responses of successfully validated entries into the primary entry tables
--              The 'prevalid' uri_entry_id is needed, and so is the published uri_entry_id from the uri_entries table.
--              The responses entries are copied then the flagged_for_deletion flag is set to 1.
-- =============================================
        DELIMITER //

CREATE PROCEDURE VALIDATE_Publish_Validated_Responses (

    p_var_uri_entry_id_prevalid INT,
    p_var_uri_entry_id_published INT)
BEGIN
    DECLARE NOT_FOUND INT DEFAULT 0;

    DECLARE v_var_uri_response_id BigInt;
    DECLARE v_var_linktype NVarChar(100);
    DECLARE v_var_iana_language NVarChar(45);
    DECLARE v_var_context NVarChar(100);
    DECLARE v_var_mime_type NVarChar(45);
    DECLARE v_var_link_title NVarChar(45);
    DECLARE v_var_target_url NVarChar(1024);
    DECLARE v_var_default_linktype Tinyint;
    DECLARE v_var_default_iana_language Tinyint;
    DECLARE v_var_default_context Tinyint;
    DECLARE v_var_default_mime_type Tinyint;
    DECLARE v_var_forward_request_querystrings Tinyint;
    DECLARE v_var_active Tinyint;
    DECLARE v_flagged_for_deletion Tinyint;

    /* Declare a cursor that will retrieve the 1 or more responses for the given @var_uri_entry_id_prevalid */
    DECLARE response_entry_cursor CURSOR
        FOR
        SELECT
        `uri_response_id`,
        `linktype`,
        `iana_language`,
        `context`,
        `mime_type`,
        `link_title`,
        `target_url`,
        `default_linktype`,
        `default_iana_language`,
        `default_context`,
        `default_mime_type`,
        `forward_request_querystrings`,
        `active`,
        `flagged_for_deletion`
        FROM uri_responses_prevalid
        WHERE uri_entry_id = p_var_uri_entry_id_prevalid
        AND flagged_for_deletion = 0
        FOR
    UPDATE OF `flagged_for_deletion`


    DECLARE CONTINUE HANDLER FOR NOT FOUND SET NOT_FOUND = 1;OPEN response_entry_cursor;

    FETCH NEXT FROM; response_entry_cursor INTO
        v_var_uri_response_id,
			v_var_linktype,
			v_var_iana_language,
			v_var_context,
			v_var_mime_type,
			v_var_link_title,
			v_var_target_url,
			v_var_default_linktype,
			v_var_default_iana_language,
			v_var_default_context,
			v_var_default_mime_type,
			v_var_forward_request_querystrings,
			v_var_active,
			v_flagged_for_deletion

    WHILE NOT_FOUND = 0
        DO
		/* Update the main URI_Responses table with the validated row */
		CALL UPSERT_URI_Response(
			v_var_uri_entry_id_published,
			v_var_linktype,
			v_var_iana_language,
			v_var_context,
			v_var_mime_type,
			v_var_link_title,
			v_var_target_url,
			v_var_default_linktype,
			v_var_default_iana_language,
			v_var_default_context,
			v_var_default_mime_type,
			v_var_forward_request_querystrings,
			v_var_active);

    /* Update the uri_responses_prevalid table to flag it for future deletion */
    UPDATE uri_responses_prevalid
    SET flagged_for_deletion = 1
    WHERE CURRENT OF response_entry_cursor;

    /* Fetch the next response, if any */
    FETCH NEXT FROM; response_entry_cursor INTO
        v_var_uri_response_id,
			v_var_linktype,
			v_var_iana_language,
			v_var_context,
			v_var_mime_type,
			v_var_link_title,
			v_var_target_url,
			v_var_default_linktype,
			v_var_default_iana_language,
			v_var_default_context,
			v_var_default_mime_type,
			v_var_forward_request_querystrings,
			v_var_active,
			v_flagged_for_deletion

END WHILE;

    CLOSE response_entry_cursor;
END;
//

DELIMITER ;


/****** Object:  StoredProcedure [dbo].[VALIDATE_Save_Validation_Result]    Script Date: 10/06/2020 17:31:16 ******/
/* SET ANSI_NULLS ON */

/* SET QUOTED_IDENTIFIER ON */

-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-Feb-2020
-- Description:	[VALIDATE_Save_Validation_Result] saves the result of the validation to the [uri_entries_prevalid] table.
-- =============================================
        DELIMITER //

CREATE PROCEDURE VALIDATE_Save_Validation_Result (
    p_member_primary_gln NChar(13),
    p_identification_key_type nvarchar(20),
    p_identification_key nvarchar(45),
    p_validation_code tinyint unsigned)
BEGIN
    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_success_flag bit = 0

    UPDATE uri_entries_prevalid
    SET
        `validation_code`= p_validation_code,
        `date_last_updated` = NOW()
    WHERE
        `member_primary_gln` = p_member_primary_gln AND
        `identification_key_type` = p_identification_key_type AND
        `identification_key` = p_identification_key;


    IF FOUND_ROWS() > 0 THEN
        SET @var_success_flag = 1;
END IF;

SELECT @var_success_flag as SUCCESS;

END;
//

DELIMITER ;


