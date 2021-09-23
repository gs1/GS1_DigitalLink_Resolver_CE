SELECT 'Database Create Script Started' as message

CREATE DATABASE [gs1-resolver-ce-v2-1-db]
GO

USE [gs1-resolver-ce-v2-1-db]
GO
/****** Object:  Table [dbo].[gcp_redirects]    Script Date: 12/08/2020 13:39:17 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[gcp_redirects](
	[gcp_redirect_id] [bigint] IDENTITY(1,1) NOT NULL,
	[member_primary_gln] [nchar](13) NOT NULL,
	[identification_key_type] [nvarchar](20) NOT NULL,
	[prefix_value] [nvarchar](45) NOT NULL,
	[target_url] [nvarchar](1024) NOT NULL,
	[active] [bit] NOT NULL,
	[flagged_for_deletion] [bit] NOT NULL,
	[date_inserted] [datetime] NOT NULL,
	[date_last_updated] [datetime] NOT NULL,
 CONSTRAINT [PK_gcp_resolves] PRIMARY KEY CLUSTERED 
(
	[gcp_redirect_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[resolver_auth]    Script Date: 12/08/2020 13:39:17 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[resolver_auth](
	[auth_id] [bigint] IDENTITY(1,1) NOT NULL,
	[member_primary_gln] [nchar](13) NOT NULL,
	[account_name] [nvarchar](255) NOT NULL,
	[authentication_key] [nvarchar](64) NOT NULL,
 CONSTRAINT [PK_resolver_auth] PRIMARY KEY CLUSTERED 
(
	[auth_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[server_sync_register]    Script Date: 12/08/2020 13:39:17 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[server_sync_register](
	[resolver_sync_server_id] [nchar](12) NOT NULL,
	[resolver_sync_server_hostname] [nvarchar](100) NULL,
	[last_heard_datetime] [datetime] NOT NULL,
 CONSTRAINT [PK_server_sync_register_table] PRIMARY KEY CLUSTERED 
(
	[resolver_sync_server_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[uri_entries]    Script Date: 12/08/2020 13:39:17 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[uri_entries](
	[uri_entry_id] [bigint] IDENTITY(1,1) NOT NULL,
	[member_primary_gln] [nchar](13) NOT NULL,
	[identification_key_type] [nvarchar](20) NOT NULL,
	[identification_key] [nvarchar](45) NOT NULL,
	[item_description] [nvarchar](2000) NOT NULL,
	[date_inserted] [datetime] NOT NULL,
	[date_last_updated] [datetime] NOT NULL,
	[qualifier_path] [nvarchar](255) NOT NULL,
	[active] [bit] NOT NULL,
	[flagged_for_deletion] [bit] NOT NULL,
 CONSTRAINT [PK_uri_requests_uri_request_id] PRIMARY KEY CLUSTERED 
(
	[uri_entry_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[uri_entries_prevalid]    Script Date: 12/08/2020 13:39:17 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[uri_entries_prevalid](
	[uri_entry_id] [bigint] IDENTITY(1,1) NOT NULL,
	[member_primary_gln] [nchar](13) NOT NULL,
	[identification_key_type] [nvarchar](20) NOT NULL,
	[identification_key] [nvarchar](45) NOT NULL,
	[item_description] [nvarchar](2000) NOT NULL,
	[date_inserted] [datetime] NOT NULL,
	[date_last_updated] [datetime] NOT NULL,
	[qualifier_path] [nvarchar](255) NOT NULL,
	[active] [bit] NOT NULL,
	[flagged_for_deletion] [bit] NOT NULL,
	[validation_code] [tinyint] NOT NULL,
	[batch_id] [int] NOT NULL,
 CONSTRAINT [PK_uri_requests_prevalid_uri_entry_id] PRIMARY KEY CLUSTERED 
(
	[uri_entry_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[uri_responses]    Script Date: 12/08/2020 13:39:17 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[uri_responses](
	[uri_response_id] [bigint] IDENTITY(1,1) NOT NULL,
	[uri_entry_id] [bigint] NOT NULL,
	[linktype] [nvarchar](100) NOT NULL,
	[iana_language] [nchar](2) NOT NULL,
	[context] [nvarchar](100) NOT NULL,
	[mime_type] [nvarchar](45) NOT NULL,
	[link_title] [nvarchar](45) NOT NULL,
	[target_url] [nvarchar](1024) NOT NULL,
	[default_linktype] [bit] NOT NULL,
	[default_iana_language] [bit] NOT NULL,
	[default_context] [bit] NOT NULL,
	[default_mime_type] [bit] NOT NULL,
	[forward_request_querystrings] [bit] NOT NULL,
	[active] [bit] NOT NULL,
	[flagged_for_deletion] [bit] NOT NULL,
	[date_inserted] [datetime] NOT NULL,
	[date_last_updated] [datetime] NOT NULL,
 CONSTRAINT [PK_uri_responses_uri_response_id] PRIMARY KEY CLUSTERED 
(
	[uri_response_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[uri_responses_prevalid]    Script Date: 12/08/2020 13:39:17 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[uri_responses_prevalid](
	[uri_response_id] [bigint] IDENTITY(1,1) NOT NULL,
	[uri_entry_id] [bigint] NOT NULL,
	[linktype] [nvarchar](100) NOT NULL,
	[iana_language] [nchar](2) NOT NULL,
	[context] [nvarchar](100) NOT NULL,
	[mime_type] [nvarchar](45) NOT NULL,
	[link_title] [nvarchar](45) NOT NULL,
	[target_url] [nvarchar](1024) NOT NULL,
	[default_linktype] [bit] NOT NULL,
	[default_iana_language] [bit] NOT NULL,
	[default_context] [bit] NOT NULL,
	[default_mime_type] [bit] NOT NULL,
	[forward_request_querystrings] [bit] NOT NULL,
	[active] [bit] NOT NULL,
	[flagged_for_deletion] [bit] NOT NULL,
	[date_inserted] [datetime] NOT NULL,
	[date_last_updated] [datetime] NOT NULL,
 CONSTRAINT [PK_uri_responses_prevalid_uri_response_id] PRIMARY KEY CLUSTERED 
(
	[uri_response_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[gcp_redirects] ON 
GO
INSERT [dbo].[gcp_redirects] ([gcp_redirect_id], [member_primary_gln], [identification_key_type], [prefix_value], [target_url], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (4, N'9501101020016', N'01', N'076', N'https://id.gs1.ch', 1, 0, CAST(N'2020-04-14T13:57:17.040' AS DateTime), CAST(N'2020-04-28T13:54:34.780' AS DateTime))
GO
INSERT [dbo].[gcp_redirects] ([gcp_redirect_id], [member_primary_gln], [identification_key_type], [prefix_value], [target_url], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (6, N'9501101020016', N'01', N'05065434', N'https://lansley.com/experimental', 1, 0, CAST(N'2020-06-24T10:23:34.093' AS DateTime), CAST(N'2020-06-25T16:30:58.190' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[gcp_redirects] OFF
GO
SET IDENTITY_INSERT [dbo].[resolver_auth] ON 
GO
INSERT [dbo].[resolver_auth] ([auth_id], [member_primary_gln], [account_name], [authentication_key]) VALUES (1, N'9506000038186', N'Test Account', N'5555555555555')
GO
SET IDENTITY_INSERT [dbo].[resolver_auth] OFF
GO
SET IDENTITY_INSERT [dbo].[uri_entries] ON 
GO
INSERT [dbo].[uri_entries] ([uri_entry_id], [member_primary_gln], [identification_key_type], [identification_key], [item_description], [date_inserted], [date_last_updated], [qualifier_path], [active], [flagged_for_deletion]) VALUES (1, N'9506000038186', N'01', N'09506000134352', N'[]RGFsIEdpYXJkaW5vIFJpc290dG8gUmljZSB3aXRoIE11c2hyb29tcyA0MTFn', CAST(N'2020-06-29T15:36:09.753' AS DateTime), CAST(N'2020-06-30T07:46:58.287' AS DateTime), N'/', 1, 0)
GO
INSERT [dbo].[uri_entries] ([uri_entry_id], [member_primary_gln], [identification_key_type], [identification_key], [item_description], [date_inserted], [date_last_updated], [qualifier_path], [active], [flagged_for_deletion]) VALUES (2, N'9506000038186', N'01', N'09506000134369', N'[]RGFsIEdpYXJkaW5vIEV4dHJhIFZpcmdpbiBPbGl2ZSBPaWwgRXhjbHVzaXZlIFNlbGVjdGlvbiAxTA==', CAST(N'2020-06-29T15:36:09.863' AS DateTime), CAST(N'2020-06-30T07:46:58.440' AS DateTime), N'/', 1, 0)
GO
INSERT [dbo].[uri_entries] ([uri_entry_id], [member_primary_gln], [identification_key_type], [identification_key], [item_description], [date_inserted], [date_last_updated], [qualifier_path], [active], [flagged_for_deletion]) VALUES (3, N'9506000038186', N'01', N'09506000134376', N'[]RGFsIEdpYXJkaW5vIE1lZGljaW5hbCBDb21wb3VuZCA1MCB4IDIwMG1n', CAST(N'2020-06-29T15:36:09.897' AS DateTime), CAST(N'2020-06-30T07:46:58.470' AS DateTime), N'/', 1, 0)
GO
INSERT [dbo].[uri_entries] ([uri_entry_id], [member_primary_gln], [identification_key_type], [identification_key], [item_description], [date_inserted], [date_last_updated], [qualifier_path], [active], [flagged_for_deletion]) VALUES (4, N'9506000038186', N'01', N'09506000134376', N'[]RGFsIEdpYXJkaW5vIE1lZGljaW5hbCBDb21wb3VuZCA1MCB4IDIwMG1nIHdpdGggc2VyaWFsIG51bWJlcg==', CAST(N'2020-11-09T16:17:45.553' AS DateTime), CAST(N'2020-11-09T16:26:16.493' AS DateTime), N'/ser/{serial}', 1, 0)
GO
INSERT [dbo].[uri_entries] ([uri_entry_id], [member_primary_gln], [identification_key_type], [identification_key], [item_description], [date_inserted], [date_last_updated], [qualifier_path], [active], [flagged_for_deletion]) VALUES (5, N'9506000038186', N'8004', N'95060001', N'[]RGFsIEdpYXJkaW5vIE1lZGljaW5hbCBDb21wb3VuZCAtIHRoZSBHSUFJIEFzc2V0IQ==', CAST(N'2021-09-22T16:17:45.553' AS DateTime), CAST(N'2021-09-22T16:26:16.493' AS DateTime), N'/', 1, 0)
GO
SET IDENTITY_INSERT [dbo].[uri_entries] OFF
GO
SET IDENTITY_INSERT [dbo].[uri_responses] ON 
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (1, 1, N'gs1:pip', N'en', N'xx', N'text/html', N'[]UHJvZHVjdCBJbmZvcm1hdGlvbiBQYWdl', N'https://dalgiardino.com/risotto-rice-with-mushrooms/', 1, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.757' AS DateTime), CAST(N'2020-06-30T07:46:58.290' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (2, 1, N'gs1:recipeInfo', N'en', N'xx', N'text/html', N'[]V2lsZCBNdXNocm9vbSBBbmQgQnV0dGVybnV0IFNxdWF', N'https://dalgiardino.com/mushroom-squash-risotto/', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.763' AS DateTime), CAST(N'2020-06-30T07:46:58.297' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (3, 1, N'gs1:hasRetailers', N'en', N'xx', N'text/html', N'[]UHJvZHVjdCBJbmZvcm1hdGlvbiBQYWdl', N'https://dalgiardino.com/where-to-buy/', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.770' AS DateTime), CAST(N'2020-06-30T07:46:58.300' AS DateTime))

INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (4, 1, N'gs1:productSustainabilityInfo', N'en', N'xx', N'text/html', N'[]UHJvZHVjdCBJbmZvcm1hdGlvbiBQYWdl', N'https://dalgiardino.com/about/', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.777' AS DateTime), CAST(N'2020-06-30T07:46:58.307' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (5, 1, N'gs1:pip', N'es', N'xx', N'text/html', N'[]SW5mb3JtYWNpw7NuIGRlbCBQcm9kdWN0bw==', N'https://dalgiardino.com/risotto-rice-with-mushrooms/index.html.es', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.787' AS DateTime), CAST(N'2020-06-30T07:46:58.327' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (6, 1, N'gs1:pip', N'vi', N'xx', N'text/html', N'[]VHJhbmcgdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0=', N'https://dalgiardino.com/risotto-rice-with-mushrooms/index.html.vi', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.790' AS DateTime), CAST(N'2020-06-30T07:46:58.340' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (7, 1, N'gs1:productSustainabilityInfo', N'es', N'xx', N'text/html', N'[]U29icmUgRGFsIEdpYXJkaW5v', N'https://dalgiardino.com/about/index.html.es', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.797' AS DateTime), CAST(N'2020-06-30T07:46:58.357' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (8, 1, N'gs1:productSustainabilityInfo', N'vi', N'xx', N'text/html', N'[]UGjDoXQgdHJp4buDbiBi4buBbiB24buvbmcgdsOgIHQ', N'https://dalgiardino.com/about/index.html.vi', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.800' AS DateTime), CAST(N'2020-06-30T07:46:58.377' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (9, 1, N'gs1:recipeInfo', N'es', N'xx', N'text/html', N'[]UmVjZXRhcw==', N'https://dalgiardino.com/mushroom-squash-risotto/index.html.es', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.810' AS DateTime), CAST(N'2020-06-30T07:46:58.383' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (10, 1, N'gs1:hasRetailers', N'es', N'xx', N'text/html', N'[]RG9uZGUgY29tcHJhciBEYWwgR2lhcmRpbm8=', N'https://dalgiardino.com/where-to-buy/index.html.es', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.820' AS DateTime), CAST(N'2020-06-30T07:46:58.393' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (11, 1, N'gs1:hasRetailers', N'vi', N'xx', N'text/html', N'[]TsahaSBiw6Fu', N'https://dalgiardino.com/where-to-buy/index.html.vi', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.823' AS DateTime), CAST(N'2020-06-30T07:46:58.400' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (12, 1, N'gs1:pip', N'ja', N'xx', N'text/html', N'[]UHJvZHVjdCBJbmZvcm1hdGlvbiBQYWdl', N'https://dalgiardino.com/risotto-rice-with-mushrooms/index.html.ja', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.830' AS DateTime), CAST(N'2020-06-30T07:46:58.410' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (13, 1, N'gs1:recipeInfo', N'ja', N'xx', N'text/html', N'[]44Kt44OO44Kz44Go56CV44GE44Gf44OQ44K/44O844O', N'https://dalgiardino.com/mushroom-squash-risotto/index.html.ja', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.833' AS DateTime), CAST(N'2020-06-30T07:46:58.417' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (14, 1, N'gs1:traceability', N'en', N'xx', N'text/html', N'[]VHJhY2VhYmlsaXR5IChpdGVtIGxldmVsKQ==', N'https://dalgiardino.com/risotto-rice-with-mushrooms/lot/ABC/ser/123', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.847' AS DateTime), CAST(N'2020-06-30T07:46:58.427' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (15, 2, N'gs1:pip', N'en', N'xx', N'text/html', N'[]UHJvZHVjdCBJbmZvcm1hdGlvbiBQYWdl', N'https://dalgiardino.com/extra-virgin-olive-oil/', 1, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.867' AS DateTime), CAST(N'2020-06-30T07:46:58.443' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (16, 2, N'gs1:hasRetailers', N'en', N'xx', N'text/html', N'[]UHJvZHVjdCBJbmZvcm1hdGlvbiBQYWdl', N'https://dalgiardino.com/where-to-buy/', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.877' AS DateTime), CAST(N'2020-06-30T07:46:58.450' AS DateTime))

INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (17, 2, N'gs1:pip', N'ja', N'xx', N'text/html', N'[]UHJvZHVjdCBJbmZvcm1hdGlvbiBQYWdl', N'https://dalgiardino.com/extra-virgin-olive-oil/index.html.ja', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.883' AS DateTime), CAST(N'2020-06-30T07:46:58.460' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (18, 3, N'gs1:pip', N'en', N'xx', N'text/html', N'[]UHJvZHVjdCBJbmZvcm1hdGlvbiBQYWdl', N'https://dalgiardino.com/medicinal-compound/', 1, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.900' AS DateTime), CAST(N'2020-06-30T07:46:58.477' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (19, 3, N'gs1:epil', N'en', N'xx', N'text/html', N'[]UHJvZHVjdCBJbmZvcm1hdGlvbiBQYWdl', N'https://dalgiardino.com/medicinal-compound/pil.html', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.910' AS DateTime), CAST(N'2020-06-30T07:46:58.483' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (20, 3, N'gs1:pip', N'ja', N'xx', N'text/html', N'[]UHJvZHVjdCBJbmZvcm1hdGlvbiBQYWdl', N'https://dalgiardino.com/medicinal-compound/index.html.ja', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-06-29T15:36:09.917' AS DateTime), CAST(N'2020-06-30T07:46:58.487' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (41, 4, N'gs1:pip', N'en', N'xx', N'text/html', N'Product Information Page', N'https://dalgiardino.com/medicinal-compound/index.html?serialnumber={serial}', 0, 1, 1, 1, 1, 1, 0, CAST(N'2020-11-09T16:17:45.557' AS DateTime), CAST(N'2020-11-09T16:26:16.493' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (42, 5, N'gs1:pip', N'en', N'xx', N'text/html', N'Asset Information Page (just serial number)', N'https://dalgiardino.com/medicinal-compound/index.html?assetnumber={0}', 1, 1, 1, 1, 1, 1, 0, CAST(N'2021-09-22T16:17:45.557' AS DateTime), CAST(N'2021-09-22T16:26:16.493' AS DateTime))
GO
INSERT [dbo].[uri_responses] ([uri_response_id], [uri_entry_id], [linktype], [iana_language], [context], [mime_type], [link_title], [target_url], [default_linktype], [default_iana_language], [default_context], [default_mime_type], [forward_request_querystrings], [active], [flagged_for_deletion], [date_inserted], [date_last_updated]) VALUES (43, 5, N'gs1:faqs', N'en', N'xx', N'text/html', N'Asset FAQs (full GIAI)', N'https://dalgiardino.com/medicinal-compound/index.html?assetnumber={1}', 0, 1, 1, 1, 1, 1, 0, CAST(N'2021-09-22T16:17:45.557' AS DateTime), CAST(N'2021-09-22T16:26:16.493' AS DateTime))
GO

SET IDENTITY_INSERT [dbo].[uri_responses_prevalid] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_gcp_resolves]    Script Date: 12/08/2020 13:39:20 ******/
CREATE UNIQUE NONCLUSTERED INDEX [IX_gcp_resolves] ON [dbo].[gcp_redirects]
(
	[identification_key_type] ASC,
	[prefix_value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER INDEX [IX_gcp_resolves] ON [dbo].[gcp_redirects] DISABLE
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Table_authentication_key]    Script Date: 12/08/2020 13:39:20 ******/
ALTER TABLE [dbo].[resolver_auth] ADD  CONSTRAINT [IX_Table_authentication_key] UNIQUE NONCLUSTERED 
(
	[authentication_key] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER INDEX [IX_Table_authentication_key] ON [dbo].[resolver_auth] DISABLE
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_uri_entries_gln_keytype_key]    Script Date: 12/08/2020 13:39:20 ******/
CREATE NONCLUSTERED INDEX [IX_uri_entries_gln_keytype_key] ON [dbo].[uri_entries]
(
	[member_primary_gln] ASC,
	[identification_key_type] ASC,
	[identification_key] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER INDEX [IX_uri_entries_gln_keytype_key] ON [dbo].[uri_entries] DISABLE
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_uri_responses_unique_constraint_index]    Script Date: 12/08/2020 13:39:20 ******/
CREATE UNIQUE NONCLUSTERED INDEX [IX_uri_responses_unique_constraint_index] ON [dbo].[uri_responses]
(
	[uri_entry_id] ASC,
	[linktype] ASC,
	[iana_language] ASC,
	[context] ASC,
	[mime_type] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER INDEX [IX_uri_responses_unique_constraint_index] ON [dbo].[uri_responses] DISABLE
GO
ALTER TABLE [dbo].[gcp_redirects] ADD  CONSTRAINT [DF_gcp_resolves_active]  DEFAULT ((0)) FOR [active]
GO
ALTER TABLE [dbo].[gcp_redirects] ADD  CONSTRAINT [DF_gcp_resolves_marked_for_deletion]  DEFAULT ((0)) FOR [flagged_for_deletion]
GO
ALTER TABLE [dbo].[gcp_redirects] ADD  CONSTRAINT [DF_gcp_redirects_date_inserted]  DEFAULT (getutcdate()) FOR [date_inserted]
GO
ALTER TABLE [dbo].[gcp_redirects] ADD  CONSTRAINT [DF_gcp_redirects_date_last_updated]  DEFAULT (getutcdate()) FOR [date_last_updated]
GO
ALTER TABLE [dbo].[server_sync_register] ADD  CONSTRAINT [DF_server_sync_register_table_last_heard_unixtime]  DEFAULT (getutcdate()) FOR [last_heard_datetime]
GO
ALTER TABLE [dbo].[uri_entries] ADD  CONSTRAINT [DF__uri_reque__membe__236943A5]  DEFAULT ('') FOR [member_primary_gln]
GO
ALTER TABLE [dbo].[uri_entries] ADD  CONSTRAINT [DF__uri_reque__gs1_k__245D67DE]  DEFAULT ('') FOR [identification_key_type]
GO
ALTER TABLE [dbo].[uri_entries] ADD  CONSTRAINT [DF__uri_reque__gs1_k__25518C17]  DEFAULT ('') FOR [identification_key]
GO
ALTER TABLE [dbo].[uri_entries] ADD  CONSTRAINT [DF__uri_reque__item___2645B050]  DEFAULT ('NEW') FOR [item_description]
GO
ALTER TABLE [dbo].[uri_entries] ADD  CONSTRAINT [DF__uri_reque__date___2739D489]  DEFAULT (getutcdate()) FOR [date_inserted]
GO
ALTER TABLE [dbo].[uri_entries] ADD  CONSTRAINT [DF__uri_reque__date___282DF8C2]  DEFAULT (getutcdate()) FOR [date_last_updated]
GO
ALTER TABLE [dbo].[uri_entries] ADD  CONSTRAINT [DF__uri_reque__web_u__2A164134]  DEFAULT ('') FOR [qualifier_path]
GO
ALTER TABLE [dbo].[uri_entries] ADD  CONSTRAINT [DF__uri_reque__activ__29221CFB]  DEFAULT ((1)) FOR [active]
GO
ALTER TABLE [dbo].[uri_entries] ADD  CONSTRAINT [DF_uri_requests_flagged_for_deletion]  DEFAULT ((0)) FOR [flagged_for_deletion]
GO
ALTER TABLE [dbo].[uri_entries_prevalid] ADD  CONSTRAINT [DF__uri_reque__membe__136943A5]  DEFAULT ('') FOR [member_primary_gln]
GO
ALTER TABLE [dbo].[uri_entries_prevalid] ADD  CONSTRAINT [DF__uri_reque__gs1_k__145D67DE]  DEFAULT ('') FOR [identification_key_type]
GO
ALTER TABLE [dbo].[uri_entries_prevalid] ADD  CONSTRAINT [DF__uri_reque__gs1_k__15518C17]  DEFAULT ('') FOR [identification_key]
GO
ALTER TABLE [dbo].[uri_entries_prevalid] ADD  CONSTRAINT [DF__uri_reque__item___1645B050]  DEFAULT ('NEW') FOR [item_description]
GO
ALTER TABLE [dbo].[uri_entries_prevalid] ADD  CONSTRAINT [DF__uri_reque__date___1739D489]  DEFAULT (getutcdate()) FOR [date_inserted]
GO
ALTER TABLE [dbo].[uri_entries_prevalid] ADD  CONSTRAINT [DF__uri_reque__date___182DF8C2]  DEFAULT (getutcdate()) FOR [date_last_updated]
GO
ALTER TABLE [dbo].[uri_entries_prevalid] ADD  CONSTRAINT [DF__uri_reque__web_u__1A164134]  DEFAULT ('') FOR [qualifier_path]
GO
ALTER TABLE [dbo].[uri_entries_prevalid] ADD  CONSTRAINT [DF__uri_reque__activ__19221CFB]  DEFAULT ((1)) FOR [active]
GO
ALTER TABLE [dbo].[uri_entries_prevalid] ADD  CONSTRAINT [DF_uri_requests_flagged_for_deletion1]  DEFAULT ((0)) FOR [flagged_for_deletion]
GO
ALTER TABLE [dbo].[uri_entries_prevalid] ADD  CONSTRAINT [DF_uri_entries_validation_code1]  DEFAULT ((255)) FOR [validation_code]
GO
ALTER TABLE [dbo].[uri_entries_prevalid] ADD  CONSTRAINT [DF_uri_entries_batch_id1]  DEFAULT ((0)) FOR [batch_id]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__attri__3A4CA8FD]  DEFAULT ('') FOR [linktype]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__iana___3864608B]  DEFAULT ('') FOR [iana_language]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_context]  DEFAULT ('') FOR [context]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__desti__40F9A68C]  DEFAULT (N'text/html') FOR [mime_type]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__alt_a__3D2915A8]  DEFAULT ('') FOR [link_title]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__desti__3B40CD36]  DEFAULT ('') FOR [target_url]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_default_linktype]  DEFAULT ((0)) FOR [default_linktype]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_default_iana_language]  DEFAULT ((0)) FOR [default_iana_language]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_default_context]  DEFAULT ((0)) FOR [default_context]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_default_mime_type]  DEFAULT ((0)) FOR [default_mime_type]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__forwa__41EDCAC5]  DEFAULT ((0)) FOR [forward_request_querystrings]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF__uri_respo__activ__3E1D39E1]  DEFAULT ((0)) FOR [active]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_flagged_for_deletion]  DEFAULT ((0)) FOR [flagged_for_deletion]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_date_inserted]  DEFAULT (getutcdate()) FOR [date_inserted]
GO
ALTER TABLE [dbo].[uri_responses] ADD  CONSTRAINT [DF_uri_responses_date_last_updated]  DEFAULT (getutcdate()) FOR [date_last_updated]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF__uri_respo__attri__1A4CA8FD]  DEFAULT ('') FOR [linktype]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF__uri_respo__iana___1864608B]  DEFAULT ('') FOR [iana_language]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF_uri_responses_context1]  DEFAULT ('') FOR [context]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF__uri_respo__desti__10F9A68C]  DEFAULT (N'text/html') FOR [mime_type]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF__uri_respo__alt_a__1D2915A8]  DEFAULT ('') FOR [link_title]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF__uri_respo__desti__1B40CD36]  DEFAULT ('') FOR [target_url]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF_uri_responses_default_linktype1]  DEFAULT ((0)) FOR [default_linktype]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF_uri_responses_default_iana_language1]  DEFAULT ((0)) FOR [default_iana_language]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF_uri_responses_default_context1]  DEFAULT ((0)) FOR [default_context]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF_uri_responses_default_mime_type1]  DEFAULT ((0)) FOR [default_mime_type]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF__uri_respo__forwa__11EDCAC5]  DEFAULT ((0)) FOR [forward_request_querystrings]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF__uri_respo__activ__1E1D39E1]  DEFAULT ((0)) FOR [active]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF_uri_responses_flagged_for_deletion1]  DEFAULT ((0)) FOR [flagged_for_deletion]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF_uri_responses_date_inserted1]  DEFAULT (getutcdate()) FOR [date_inserted]
GO
ALTER TABLE [dbo].[uri_responses_prevalid] ADD  CONSTRAINT [DF_uri_responses_date_last_updated1]  DEFAULT (getutcdate()) FOR [date_last_updated]
GO
ALTER TABLE [dbo].[uri_responses]  WITH NOCHECK ADD  CONSTRAINT [FK_uri_responses_uri_requests] FOREIGN KEY([uri_entry_id])
REFERENCES [dbo].[uri_entries] ([uri_entry_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[uri_responses] NOCHECK CONSTRAINT [FK_uri_responses_uri_requests]
GO
ALTER TABLE [dbo].[uri_responses_prevalid]  WITH NOCHECK ADD  CONSTRAINT [FK_uri_responses_prevalid_uri_entries_prevalid] FOREIGN KEY([uri_entry_id])
REFERENCES [dbo].[uri_entries_prevalid] ([uri_entry_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[uri_responses_prevalid] NOCHECK CONSTRAINT [FK_uri_responses_prevalid_uri_entries_prevalid]
GO
/****** Object:  StoredProcedure [dbo].[ADMIN_DELETE_Account]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 09-JUN-2020
-- Description:	[ADMIN_DELETE_Account] removes an unauthorised account from the database
-- =============================================
CREATE PROCEDURE [dbo].[ADMIN_DELETE_Account]
    @var_member_primary_gln NChar(23),
    @var_account_name nvarchar(255),
    @var_authentication_key nvarchar(64)
AS
BEGIN

    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_success_flag bit = 0

	DELETE
	FROM resolver_auth
    WHERE member_primary_gln = @var_member_primary_gln
      AND account_name = @var_account_name
      AND authentication_key = @var_authentication_key

    IF @@ROWCOUNT > 0
        SELECT @var_success_flag = 1

    SELECT @var_success_flag as SUCCESS;
END
GO
/****** Object:  StoredProcedure [dbo].[ADMIN_DELETE_Build_Server_From_Sync_Register]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Date:        09-06-2020
-- Description: Deletes the requested build server from the heard list (which will trigger the build server
--              to rebuild its data store from scratch
-- =============================================
CREATE PROCEDURE [dbo].[ADMIN_DELETE_Build_Server_From_Sync_Register] 
	@var_sync_server_id NChar(12)
AS
BEGIN
    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_success_flag bit = 0

	DELETE
	FROM server_sync_register
	WHERE resolver_sync_server_id = @var_sync_server_id

	    IF @@ROWCOUNT > 0
        BEGIN
            SELECT @var_success_flag = 1
        END

    SELECT @var_success_flag as SUCCESS;
END
GO
/****** Object:  StoredProcedure [dbo].[ADMIN_GET_Accounts]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 09-JUN-2020
-- Description:	Lists the authenticated accounts in this database
-- =============================================
CREATE PROCEDURE [dbo].[ADMIN_GET_Accounts]

AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

SELECT
    [member_primary_gln],
    [account_name],
    [authentication_key]
  FROM [resolver_auth]
  ORDER BY [member_primary_gln], [account_name]
END
GO
/****** Object:  StoredProcedure [dbo].[ADMIN_GET_Heard_Build_Servers]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 09-06-2020
-- Description:	Lists the Build servers synchronising with this database
-- =============================================
CREATE PROCEDURE [dbo].[ADMIN_GET_Heard_Build_Servers]

AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

SELECT
	[resolver_sync_server_id],
	[resolver_sync_server_hostname],
    [last_heard_datetime]
  FROM [server_sync_register]
  ORDER BY [last_heard_datetime] DESC
END
GO
/****** Object:  StoredProcedure [dbo].[ADMIN_UPSERT_Account]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	[ADMIN_UPSERT_Account] UPdates or inSERTs an authorised account 
--              with authentication key accepted by the API
-- =============================================
CREATE PROCEDURE [dbo].[ADMIN_UPSERT_Account]
    @var_member_primary_gln NChar(23),
    @var_account_name nvarchar(255),
    @var_authentication_key nvarchar(64)
AS
BEGIN
    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

	DECLARE @var_success_flag bit = 0
    DECLARE @count INT = 0
	DECLARE @auth_id BigInt = 0


	/* See if we can find the entry already in the live uri_entries table */
    SELECT @auth_id = auth_id
    FROM resolver_auth
    WHERE member_primary_gln = @var_member_primary_gln
      AND account_name = @var_account_name
      AND authentication_key = @var_authentication_key

	
	/* should @auth_id become null, set it back to 0 */
	SELECT @auth_id = ISNULL(@auth_id, 0) 
	
    IF @auth_id = 0
        BEGIN
            /* insert a new record */
           INSERT INTO [dbo].[resolver_auth]
           (
			   [member_primary_gln],
			   [account_name],
			   [authentication_key]
		   )
			VALUES
            (
                @var_member_primary_gln,
                @var_account_name,
                @var_authentication_key
            )

			/* If the undert was successful, rowcount will be > 0 */
			IF @@ROWCOUNT > 0
				SELECT @var_success_flag = 1
        END
    ELSE
        BEGIN
            /* Update an existing record in the [resolver_auth] table */
			UPDATE [resolver_auth] 
			SET	[member_primary_gln] = @var_member_primary_gln,
				[account_name] = @var_account_name,
				[authentication_key] = @var_authentication_key
            WHERE auth_id = @auth_id

			IF @@ROWCOUNT > 0
				SELECT @var_success_flag = 1

        END

	SELECT @var_success_flag AS SUCCESS
END
GO
/****** Object:  StoredProcedure [dbo].[BUILD_Get_GCP_Redirects]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 14-04-2020
-- Description:	Gets all the GCP redirects staring at a given lowest redirect_id (default 0) and batch size (default 1000)
--              Which is used by the BUILD application to rebuild its local document database from scratch / perform a full sync.

-- =============================================
CREATE PROCEDURE [dbo].[BUILD_Get_GCP_Redirects]
    @var_last_heard_datetime  nvarchar(30),
    @var_lowest_gcp_redirect_id bigint = 0,
    @var_max_rows_to_return int = 1000
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DECLARE @last_heard datetime = CONVERT(DATETIME, @var_last_heard_datetime)

    SELECT @var_max_rows_to_return = ISNULL(@var_max_rows_to_return, 1000)

    SELECT TOP (@var_max_rows_to_return)
        gcp_redirect_id,
        member_primary_gln,
        identification_key_type,
        prefix_value,
        target_url,
        active
    FROM [gcp_redirects]
    WHERE gcp_redirect_id >= @var_lowest_gcp_redirect_id
      AND date_last_updated > @last_heard
    ORDER BY gcp_redirect_id

END
GO
/****** Object:  StoredProcedure [dbo].[BUILD_Get_URI_Entries]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 24-FEB-2020
-- Description:	Gets all the URI entries staring at a given lowest entry_id (default 0) and batch size (default 1000) for a given last heard date time
--              Which is used by the BUILD application to rebuild its local document database from scratch / perform a full sync.
-- =============================================
CREATE PROCEDURE [dbo].[BUILD_Get_URI_Entries]
(
    @var_last_heard_datetime nvarchar(30),
    @var_lowest_entry_id bigint = 0,
    @var_max_rows_to_return int = 1000
)
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DECLARE @last_heard datetime = CONVERT(DATETIME, @var_last_heard_datetime)

    SELECT @var_max_rows_to_return = ISNULL(@var_max_rows_to_return, 1000)

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
    FROM [uri_entries]
    WHERE uri_entry_id >= @var_lowest_entry_id
      AND date_last_updated > @last_heard
    ORDER BY uri_entry_id

END
GO
/****** Object:  StoredProcedure [dbo].[BUILD_GET_URI_entries_using_identification_key]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-Feb-2020
-- Description:	Used by the Build process to get URI entries based on the supplied gs1 key code and value
-- =============================================
CREATE PROCEDURE [dbo].[BUILD_GET_URI_entries_using_identification_key]
    @var_identification_key_type nvarchar(20),
    @var_identification_key nvarchar(45)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON;


    SELECT
        [uri_entry_id],
        [member_primary_gln],
        [identification_key_type],
        [identification_key],
        [item_description],
        [date_inserted],
        [date_last_updated],
        [qualifier_path],
        [active]
    FROM [dbo].[uri_entries]
    WHERE identification_key_type = @var_identification_key_type
      AND identification_key = @var_identification_key
      AND flagged_for_deletion = 0

END
GO
/****** Object:  StoredProcedure [dbo].[BUILD_Register_Sync_Server]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
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
CREATE PROCEDURE [dbo].[BUILD_Register_Sync_Server]
	@sync_server_id NCHAR(12),
	@sync_server_hostname NVARCHAR(100) = '(UNKNOWN)'
AS
BEGIN

    SET  XACT_ABORT  ON

    SET  NOCOUNT  ON

    DECLARE @last_heard_datetime DATETIME

    SELECT @last_heard_datetime = last_heard_datetime
    FROM server_sync_register
    WHERE resolver_sync_server_id = @sync_server_id

    IF @last_heard_datetime iS NULL
        BEGIN
            INSERT INTO server_sync_register 
			(
				resolver_sync_server_id, 
				resolver_sync_server_hostname, 
				last_heard_datetime
			)
            VALUES 
			(
				@sync_server_id,
				@sync_server_hostname,
				GETUTCDATE()
			)

            SELECT @last_heard_datetime = CONVERT(DATETIME, '2020-01-01', 102);
        END

    ELSE

        BEGIN

            UPDATE server_sync_register
            SET last_heard_datetime = GETUTCDATE(),
				resolver_sync_server_hostname = @sync_server_hostname
            WHERE resolver_sync_server_id = @sync_server_id

        END

    SELECT
        @last_heard_datetime AS last_heard_datetime
END
GO
/****** Object:  StoredProcedure [dbo].[COUNT_URI_Entries_using_member_primary_gln]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-Apr-2020
-- Description:	[COUNT_URI_Entries_using_member_primary_gln] counts the URI entries and returns a count
--              of records matching @var_member_primary_gln
-- =============================================
CREATE PROCEDURE [dbo].[COUNT_URI_Entries_using_member_primary_gln]
	@var_member_primary_gln nchar(13)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON;

    SELECT
	    COUNT(*) as entry_count
    FROM [dbo].[uri_entries] 
    WHERE member_primary_gln = @var_member_primary_gln
      AND flagged_for_deletion = 0

END
GO
/****** Object:  StoredProcedure [dbo].[DELETE_GCP_Redirect]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 05-JUN-2020
-- Description:	DELETE_GCP_Redirect sets flagged_for_deletion = 1 and active = 1 for the supplied GCP
--              This does not delete the record, but flags it for deletion by a later end-of-day process.
-- =============================================
CREATE PROCEDURE [dbo].[DELETE_GCP_Redirect]
	@var_member_primary_gln NCHAR(13),
	@var_identification_key_type NVarCHar(20),
	@var_prefix_value NVARCHAR(45)
AS
BEGIN

    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_success_flag bit = 0

    BEGIN TRANSACTION

        UPDATE gcp_redirects
        SET flagged_for_deletion = 1, 
			active = 0, 
			date_last_updated = GETDATE()
		WHERE member_primary_gln = @var_member_primary_gln
		  AND identification_key_type = @var_identification_key_type
		  AND prefix_value = @var_prefix_value

        IF @@ROWCOUNT > 0
            BEGIN
                SELECT @var_success_flag = 1
            END

    COMMIT TRANSACTION

    SELECT @var_success_flag as SUCCESS;
END
GO
/****** Object:  StoredProcedure [dbo].[DELETE_URI_Entry]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-FEB-2020
-- Description:	DELETE_URI_Entry sets the 'flagged_for_deletion' column to 1 and active to 0 for the supplied entry and all of its responses.
--              In the meantime, this entry will be removed from MongoDB as active is now 0 and the Build application
--              will read this row since date_last_updated is updated to right now.
--              This does not delete the record, but flags it for deletion by a later end-of-day process.
-- =============================================
CREATE PROCEDURE [dbo].[DELETE_URI_Entry]
    @var_member_primary_gln nchar(13),
    @var_identification_key_type nvarchar(20),
    @var_identification_key nvarchar(45)
AS
BEGIN

    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_success_flag bit = 0


    /* Update the uri_responses_table */
    UPDATE uri_responses
    SET flagged_for_deletion = 1, active = 0, date_last_updated = GETDATE()
	WHERE uri_entry_id IN
	(
		SELECT uri_entry_id
		FROM uri_entries
		WHERE identification_key_type = @var_identification_key_type
		  AND identification_key = @var_identification_key
		  AND member_primary_gln = @var_member_primary_gln
	)


    /* Update the uri_entries_table */
    UPDATE uri_entries
    SET flagged_for_deletion = 1, active = 0, date_last_updated = GETDATE()
    WHERE identification_key_type = @var_identification_key_type
	  AND identification_key = @var_identification_key
      AND member_primary_gln = @var_member_primary_gln

    IF @@ROWCOUNT > 0
        BEGIN
            SELECT @var_success_flag = 1
        END

    SELECT @var_success_flag as SUCCESS;
END
GO
/****** Object:  StoredProcedure [dbo].[END_OF_DAY]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 2020-06-08
-- Description:	END-OF-DAY Master Routine
-- =============================================
CREATE PROCEDURE [dbo].[END_OF_DAY] 
AS
BEGIN
	SET NOCOUNT ON;

	EXEC ENDOFDAY_Delete_Flagged_URI_Entries_Prevalid;
	EXEC ENDOFDAY_Delete_Flagged_URI_Entries;
	EXEC ENDOFDAY_Delete_Flagged_GCP_Entries;
END
GO
/****** Object:  StoredProcedure [dbo].[ENDOFDAY_Delete_Flagged_GCP_Entries]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 21-FEB-2020
-- Description: SQL DELETES all GCP entries flagged for deletion
-- =============================================
CREATE PROCEDURE [dbo].[ENDOFDAY_Delete_Flagged_GCP_Entries]
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON;

    DELETE FROM gcp_redirects
	WHERE active = 0
	AND DATEDIFF(HOUR, date_last_updated, GETDATE()) > 24

END
GO
/****** Object:  StoredProcedure [dbo].[ENDOFDAY_Delete_Flagged_URI_Entries]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 21-FEB-2020
-- Description: SQL DELETES all URI entries flagged for deletion for more than 24 hours
--              and where active is set to 0. If active was still set to 1
--              the data would not be removed from the Mongo DB.
-- =============================================
CREATE PROCEDURE [dbo].[ENDOFDAY_Delete_Flagged_URI_Entries]
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON;

    DELETE FROM uri_entries
    WHERE flagged_for_deletion = 1
	AND active = 0
	AND DATEDIFF(HOUR, date_last_updated, GETDATE()) > 24
END
GO
/****** Object:  StoredProcedure [dbo].[ENDOFDAY_Delete_Flagged_URI_Entries_Prevalid]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 21-FEB-2020
-- Description: SQL DELETES all URI entries in the Prevalid flagged for deletion 
--              AND that are over a day old, so that clients have up to 24 hours
--              to pick up their pending / completed batch results
-- =============================================
CREATE PROCEDURE [dbo].[ENDOFDAY_Delete_Flagged_URI_Entries_Prevalid]
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON;

    DELETE FROM uri_entries_prevalid
    WHERE flagged_for_deletion = 1
	AND DATEDIFF(HOUR, date_last_updated, GETDATE()) > 24


END
GO
/****** Object:  StoredProcedure [dbo].[GET_GCP_Redirects]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 05-JUN-2020
-- Description:	Returns all the GCP Redirect entries for the supplied member's primary GLN
-- =============================================
CREATE PROCEDURE [dbo].[GET_GCP_Redirects]
	@var_member_primary_gln NCHAR(13)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT identification_key_type,
           prefix_value,
           target_url,
           active
    FROM [gcp_redirects]
    WHERE member_primary_gln = @var_member_primary_gln
      AND flagged_for_deletion = 0
    ORDER BY prefix_value

END
GO
/****** Object:  StoredProcedure [dbo].[GET_URI_Entries_using_gln_and_identification_key]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-Feb-2020
-- Description:	[GET_URI_Entries_using_gln_and_identification_key_type_and_value]
--               searches for the URI entrys based on the supplied gln, gs1 key code and value
-- =============================================
CREATE PROCEDURE [dbo].[GET_URI_Entries_using_gln_and_identification_key]
    @var_identification_key_type nvarchar(20),
    @var_identification_key nvarchar(45),
    @var_member_primary_gln nchar(13)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON;


    SELECT
        [uri_entry_id],
        [member_primary_gln],
        [identification_key_type],
        [identification_key],
        [item_description],
        [date_inserted],
        [date_last_updated],
        [qualifier_path],
        [active]
    FROM [dbo].[uri_entries]
    WHERE identification_key_type = @var_identification_key_type
      AND identification_key = @var_identification_key
      AND member_primary_gln = @var_member_primary_gln
      AND flagged_for_deletion = 0

END
GO
/****** Object:  StoredProcedure [dbo].[GET_URI_Entries_using_identification_key]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-Feb-2020
-- Description:	[GET_URI_Entries_using_identification_key] searches for the URI entrys based on the supplied identification key and type
-- =============================================
CREATE PROCEDURE [dbo].[GET_URI_Entries_using_identification_key]
    @var_identification_key_type nvarchar(20),
    @var_identification_key nvarchar(45),
    @var_member_primary_gln nchar(13)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON;

    SELECT
        [uri_entry_id],
        [member_primary_gln],
        [identification_key_type],
        [identification_key],
        [item_description],
        [date_inserted],
        [date_last_updated],
        [qualifier_path],
        [active]
    FROM [dbo].[uri_entries]
    WHERE identification_key_type = @var_identification_key_type
      AND identification_key = @var_identification_key
      AND member_primary_gln = @var_member_primary_gln
      AND flagged_for_deletion = 0

END
GO
/****** Object:  StoredProcedure [dbo].[GET_URI_Entries_using_member_primary_gln]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-Feb-2020
-- Description:	[GET_URI_Entries_using_member_primary_gln] searches for the URI entries based on the supplied member_primary_gln
--              and SQL's paging capability, allowing clients to read the data in batches.
-- =============================================
CREATE PROCEDURE [dbo].[GET_URI_Entries_using_member_primary_gln]
    @var_member_primary_gln nchar(13),
    @var_page_number INT = 1,
    @var_page_size INT = 1000
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON;

    SELECT
        [uri_entry_id],
        [member_primary_gln],
        [identification_key_type],
        [identification_key],
        [item_description],
        [date_inserted],
        [date_last_updated],
        [qualifier_path],
        [active]
    FROM [dbo].[uri_entries]
    WHERE member_primary_gln = @var_member_primary_gln
      AND flagged_for_deletion = 0
    ORDER BY identification_key
	OFFSET @var_page_size * (@var_page_number - 1) ROWS
  FETCH NEXT @var_page_size ROWS ONLY;

END
GO
/****** Object:  StoredProcedure [dbo].[GET_URI_Responses]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-FEB-2020
-- Description:	SEARCH_UI_Responses__uri_entry_id finds all the responses for a particular entry, and returns them
--              oreded by  linktype, iana_language, context, and mime_type
-- =============================================
CREATE PROCEDURE [dbo].[GET_URI_Responses]
@var_uri_entry_id bigint
AS
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
    WHERE uri_entry_id = @var_uri_entry_id
	AND flagged_for_deletion = 0
    ORDER BY linktype, iana_language, context, mime_type

END
GO
/****** Object:  StoredProcedure [dbo].[INTERNAL_Ensure_Entry_Has_Active_Responses]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 26-FEB-2020
-- Description:	We must check if there is at least one responses with active = 1 (and not flagged for deletion)
-- for the associated entry. If not, the entry has no active responses so must have its active flag set to 0 */
-- A Entry cannot be active unless it has at least one active Response.
-- =============================================
CREATE PROCEDURE [dbo].[INTERNAL_Ensure_Entry_Has_Active_Responses]
@var_uri_entry_id bigint
AS
BEGIN
    DECLARE @var_count INT = 0

    SELECT @var_count = COUNT(*)
    FROM uri_responses
    WHERE uri_entry_id = @var_uri_entry_id
      AND active = 1 AND flagged_for_deletion = 0

    IF @var_count = 0
        UPDATE uri_entries
        SET active = 0
        WHERE uri_entry_id = @var_uri_entry_id
END
GO
/****** Object:  StoredProcedure [dbo].[READ_GCP_Redirect]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 20-FEB-2020
-- Description:	Reads the GCP Redirect entry
-- =============================================
CREATE PROCEDURE [dbo].[READ_GCP_Redirect]
	@var_member_primary_gln NCHAR(13),
	@var_identification_key_type NVarCHar(20),
	@var_prefix_value NVARCHAR(45)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT identification_key_type,
           prefix_value,
           target_url,
           active
    FROM [gcp_redirects]
    WHERE member_primary_gln = @var_member_primary_gln
	  AND identification_key_type = @var_identification_key_type
	  AND prefix_value = @var_prefix_value
      AND flagged_for_deletion = 0

END
GO
/****** Object:  StoredProcedure [dbo].[READ_Resolver_Auth]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:      Nick Lansley
-- Create Date: 17 March 2020
-- Description: Checks the authentication key of an incoming entry
--              Temporary authentication which should be replaced by a more robust service
-- =============================================
CREATE PROCEDURE [dbo].[READ_Resolver_Auth]
(
    @varAuthKey nvarchar(64)
)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON

    SELECT
        COUNT(*) AS success,
        min(member_primary_gln) AS member_primary_gln
    FROM resolver_auth
    WHERE authentication_key = @varAuthKey


END
GO
/****** Object:  StoredProcedure [dbo].[READ_URI_Entry]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-Feb-2020
-- Description:	READ_URI_Entry reads the URI entry record based on the supplied uri_entry_id
-- =============================================
CREATE PROCEDURE [dbo].[READ_URI_Entry]
    @var_uri_entry_id bigint,
    @var_member_primary_gln nchar(13)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON;


    SELECT [uri_entry_id],
           [member_primary_gln],
           [identification_key_type],
           [identification_key],
           [item_description],
           [date_inserted],
           [date_last_updated],
           [qualifier_path],
           [active]
    FROM [dbo].[uri_entries]
    WHERE uri_entry_id = @var_uri_entry_id
      AND member_primary_gln = @var_member_primary_gln
      AND flagged_for_deletion = 0


END
GO
/****** Object:  StoredProcedure [dbo].[READ_URI_Response]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-FEB-2020
-- Description:	READ_URI_Response reads the response for a given uri_response_id
-- =============================================
CREATE PROCEDURE [dbo].[READ_URI_Response]
@var_uri_response_id bigint
AS
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
    WHERE uri_response_id = @var_uri_response_id
      AND flagged_for_deletion = 0

END
GO
/****** Object:  StoredProcedure [dbo].[UPSERT_GCP_Redirect]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 05-JUN-2020
-- Description:	Inserts or updates a new or existing GCP Redirect
-- =============================================
CREATE PROCEDURE [dbo].[UPSERT_GCP_Redirect]
    @var_member_primary_gln nchar(13),
    @var_identification_key_type nvarchar(20),
    @var_prefix_value nvarchar(45),
    @var_target_url nvarchar(255),
    @var_active bit
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @var_gcp_redirect_id bigint = 0
	DECLARE @var_success_flag bit = 0


    /* Find out if that key code and value combination already exists */

    SELECT @var_gcp_redirect_id = gcp_redirect_id
    FROM gcp_redirects
    WHERE identification_key_type = @var_identification_key_type
      AND prefix_value = @var_prefix_value

  	/* If no rows come back, @var_gcp_redirect_id may become NULL
	   in which case we need to get it back to 0 */
	SELECT @var_gcp_redirect_id = ISNULL(@var_gcp_redirect_id, 0) 

    IF @var_gcp_redirect_id = 0
        BEGIN
            INSERT INTO [dbo].[gcp_redirects]
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
                @var_member_primary_gln,
                @var_identification_key_type,
                @var_prefix_value,
                @var_target_url,
                @var_active,
                0,
                GETUTCDATE(),
                GETUTCDATE()
            )

            SELECT @var_gcp_redirect_id = SCOPE_IDENTITY()

        END

    ELSE
        /* Find the existing gcp_redirect_id value and update the record */
		BEGIN

		UPDATE [dbo].[gcp_redirects]
		SET member_primary_gln = @var_member_primary_gln,
			identification_key_type = @var_identification_key_type,
			prefix_value = @var_prefix_value,
			target_url = @var_target_url,
			active  = @var_active,
			flagged_for_deletion = 0,
			date_last_updated = GETUTCDATE()
		WHERE identification_key_type = @var_identification_key_type
		  AND prefix_value = @var_prefix_value

		IF @@ROWCOUNT > 0
			SELECT @var_success_flag = 1

        /* return the new gcp_redirect_id (or the updated gcp_redirect_id). */
        SELECT @var_gcp_redirect_id AS gcp_redirect_id, CONVERT(bit, 1) AS SUCCESS

		END
END
GO
/****** Object:  StoredProcedure [dbo].[UPSERT_URI_Entry]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	[UPSERT_URI_Entry] UPdates or inSERTs a URI response 
--              into the uri_entries table.
--              It is used by VALIDATE_Publish_Validated_Entries procedure.
-- =============================================
CREATE PROCEDURE [dbo].[UPSERT_URI_Entry]
    @var_member_primary_gln nchar(13),
    @var_identification_key_type nvarchar(20),
    @var_identification_key nvarchar(45),
    @var_item_description nvarchar(200),
    @var_qualifier_path nvarchar(255),
    @var_active bit,
	@var_output_uri_entry_id BigInt OUTPUT
AS
BEGIN

    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

	DECLARE @var_success_flag bit = 0
    DECLARE @count INT = 0

	/* As @var_output_uri_entry_id is an INPUT/OUTPUT variable, its value from a previous
	   call by the calling procedure (which is looping) may come back in, so clear it zero */
	SELECT @var_output_uri_entry_id = 0

	/* See if we can find the entry already in the live uri_entries table */
    SELECT @var_output_uri_entry_id = uri_entry_id
    FROM [uri_entries]
    WHERE member_primary_gln = @var_member_primary_gln
      AND identification_key_type = @var_identification_key_type
      AND identification_key = @var_identification_key
      AND qualifier_path = @var_qualifier_path

	
	/* should var_output_uri_entry_id become null, set it back to 0 */
	SELECT @var_output_uri_entry_id = ISNULL(@var_output_uri_entry_id, 0) 
	
    IF @var_output_uri_entry_id = 0
        BEGIN
            /* insert a new record */
            INSERT INTO [dbo].[uri_entries]
            (
                [member_primary_gln],
                [identification_key_type],
                [identification_key],
                [item_description],
                [date_inserted],
                [date_last_updated],
                [qualifier_path],
                [active],
                [flagged_for_deletion]
            )
            VALUES
            (
                @var_member_primary_gln,
                @var_identification_key_type,
                @var_identification_key,
                @var_item_description,
                GETUTCDATE(),
                GETUTCDATE(),
                @var_qualifier_path,
                @var_active,
                0 /* flagged_for_deletion set to 0 (false) */
            )


            /* store the new uri_entry_id from the IDENTITY as the record is inserted */
            SELECT @var_output_uri_entry_id = SCOPE_IDENTITY()

        END
    ELSE
        BEGIN
            /* Update an existing record in the [uri_entries] table */
			UPDATE [uri_entries]
			SET	member_primary_gln = @var_member_primary_gln,
				identification_key_type = @var_identification_key_type,
				identification_key = @var_identification_key,
				item_description = @var_item_description,
				date_last_updated = getutcdate(),
				qualifier_path = @var_qualifier_path,
				active = @var_active,
				flagged_for_deletion = 0
            WHERE uri_entry_id = @var_output_uri_entry_id

			IF @@ROWCOUNT > 0
				SELECT @var_success_flag = 1

        END

END
GO
/****** Object:  StoredProcedure [dbo].[UPSERT_URI_Entry_Prevalid]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	[UPSERT_URI_Entry_Prevalid]UPdates or inSERTs a URI response 
--              into the uri_entries_prevalid table
-- =============================================
CREATE PROCEDURE [dbo].[UPSERT_URI_Entry_Prevalid]
    @var_member_primary_gln nchar(13),
    @var_identification_key_type nvarchar(20),
    @var_identification_key nvarchar(45),
    @var_item_description nvarchar(200),
    @var_qualifier_path nvarchar(255),
    @var_active bit,
	@var_batch_id int = 0,
	@var_validation_code tinyint = 0
AS
BEGIN

    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_uri_entry_id bigint = 0
	DECLARE @var_success_flag bit = 0
    DECLARE @count INT = 0

    SELECT @var_uri_entry_id = uri_entry_id
    FROM [uri_entries_prevalid]
    WHERE member_primary_gln = @var_member_primary_gln
      AND identification_key_type = @var_identification_key_type
      AND identification_key = @var_identification_key
      AND qualifier_path = @var_qualifier_path

   	/* If no rows come back, @@var_uri_entry_id may become NULL
	   in which case we need to get it back to 0 */
	SELECT @var_uri_entry_id = ISNULL(@var_uri_entry_id, 0) 


    IF @var_uri_entry_id = 0
        BEGIN
            /* insert a new record */
            INSERT INTO [dbo].[uri_entries_prevalid]
            (
                [member_primary_gln],
                [identification_key_type],
                [identification_key],
                [item_description],
                [date_inserted],
                [date_last_updated],
                [qualifier_path],
                [active],
                [flagged_for_deletion],
				[validation_code],
				[batch_id]
            )
            VALUES
            (
                @var_member_primary_gln,
                @var_identification_key_type,
                @var_identification_key,
                @var_item_description,
                GETUTCDATE(),
                GETUTCDATE(),
                @var_qualifier_path,
                @var_active,
                0, /* flagged_for_deletion set to 0 (false) */
				@var_validation_code,
				@var_batch_id
            )


            /* store the entry id from the IDENTITY as the record is inserted */
            SELECT @var_uri_entry_id = SCOPE_IDENTITY()

            /* return the new uri_entry_id (or the updated uri_entry_id). */
            SELECT @var_uri_entry_id AS  uri_entry_id, CONVERT(bit, 1) AS SUCCESS

        END
    ELSE
        BEGIN
            /* Update an existing record in the prevalid table */

			UPDATE [uri_entries_prevalid]
			SET	member_primary_gln = @var_member_primary_gln,
				identification_key_type = @var_identification_key_type,
				identification_key = @var_identification_key,
				item_description = @var_item_description,
				date_last_updated = getutcdate(),
				qualifier_path = @var_qualifier_path,
				active = @var_active,
				flagged_for_deletion = 0,
				validation_code = @var_validation_code,
				batch_id = @var_batch_id
            WHERE uri_entry_id = @var_uri_entry_id

			IF @@ROWCOUNT > 0
				SELECT @var_success_flag = 1

			SELECT @var_uri_entry_id AS uri_entry_id, @var_success_flag as SUCCESS
        END

END
GO
/****** Object:  StoredProcedure [dbo].[UPSERT_URI_Response]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	[UPSERT_URI_Response] UPdates or inSERTs a new URI response 
--              into the uri_responses table.
--              This is executed by the VALIDATE_Publish_Validated_Responses procedure.
-- =============================================
CREATE PROCEDURE [dbo].[UPSERT_URI_Response]
    @var_uri_entry_id_published bigint,
    @var_linktype nvarchar(100),
    @var_iana_language nchar(2),
    @var_context nvarchar(100),
    @var_mime_type nvarchar(45),
    @var_link_title nvarchar(45),
    @var_target_url nvarchar(1024),
    @var_default_linktype bit,
    @var_default_iana_language bit,
    @var_default_context bit,
    @var_default_mime_type bit,
    @var_forward_request_querystrings bit,
    @var_active bit
AS
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
	DECLARE @var_success_flag bit = 0

        
    /* find out if this entry already exists using the unique 
	   combination of entry_id, linktype, langiage, context and mime_type.
	   Using MIN() is just a 'one row back only' safety feature */
    SELECT @var_uri_response_id = MIN(uri_response_id)
    FROM uri_responses
    WHERE uri_entry_id = @var_uri_entry_id_published
        AND linktype = @var_linktype
        AND iana_language = @var_iana_language
        AND context = @var_context
        AND mime_type = @var_mime_type

	
	/* if @var_uri_response_id has become NULL put it back to 0 */
	SELECT @var_uri_response_id = ISNULL(@var_uri_response_id, 0) 

    /* If count = 0 then insert else update */
    IF @var_uri_response_id = 0
        BEGIN
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
                @var_active,
                0,
                GETUTCDATE(),
                GETUTCDATE()
            )

            /* return the entry id from the IDENTITY as the record is inserte */
            SELECT @var_uri_response_id = SCOPE_IDENTITY();
        END
    ELSE
        BEGIN
            /* Update is required */
			UPDATE uri_responses
            SET uri_entry_id = @var_uri_entry_id_published,
                linktype = @var_linktype,
                iana_language = @var_iana_language,
                target_url = @var_target_url,
                context = @var_context,
                mime_type = @var_mime_type,
                link_title = @var_link_title,
                forward_request_querystrings = @var_forward_request_querystrings,
                active = @var_active,
				flagged_for_deletion = 0,
                default_linktype = @var_default_linktype,
                default_iana_language = @var_default_iana_language,
                default_context = @var_default_context,
                default_mime_type = @var_default_mime_type,
                date_last_updated = GETUTCDATE()
			WHERE uri_response_id = @var_uri_response_id

            IF @@ROWCOUNT > 0
                BEGIN
                    SELECT @var_success_flag = 1
                END
        END

        
END
GO
/****** Object:  StoredProcedure [dbo].[UPSERT_URI_Response_Prevalid]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	[UPSERT_URI_Response_Prevalid] UPdates or inSERTs a new URI response 
--              into the uri_responses_prevalid table
-- =============================================
CREATE PROCEDURE [dbo].[UPSERT_URI_Response_Prevalid]
    @var_uri_entry_id bigint,
    @var_linktype nvarchar(100),
    @var_iana_language nchar(2),
    @var_context nvarchar(100),
    @var_mime_type nvarchar(45),
    @var_link_title nvarchar(45),
    @var_target_url nvarchar(1024),
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

    DECLARE @var_uri_response_id bigint = 0
	DECLARE @var_success_flag bit = 0


        
    /* find out if this entry already exists */
    SELECT @var_uri_response_id = ISNULL(uri_response_id, 0)
    FROM uri_responses_prevalid
    WHERE uri_entry_id = @var_uri_entry_id
        AND linktype = @var_linktype
        AND iana_language = @var_iana_language
        AND context = @var_context
        AND mime_type = @var_mime_type

	SELECT @var_uri_response_id = ISNULL(@var_uri_response_id, 0) 

    /* If count = 0 then insert else update */
    IF @var_uri_response_id = 0
        BEGIN

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
                @var_uri_entry_id,
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
                @var_active,
                0,
                GETUTCDATE(),
                GETUTCDATE()
            )

            /* return the entry id from the IDENTITY as the record is inserte */
            SELECT @var_uri_response_id = SCOPE_IDENTITY();

            /* Return the new uri_response_id */
            SELECT @var_uri_response_id as uri_response_id, CONVERT(bit, 1) AS SUCCESS

        END
    ELSE
        BEGIN

            /* Update is required */

			UPDATE uri_responses_prevalid
            SET uri_entry_id = @var_uri_entry_id,
                linktype = @var_linktype,
                iana_language = @var_iana_language,
                target_url = @var_target_url,
                context = @var_context,
                mime_type = @var_mime_type,
                link_title = @var_link_title,
                forward_request_querystrings = @var_forward_request_querystrings,
                active = @var_active,
				flagged_for_deletion = 0,
                default_linktype = @var_default_linktype,
                default_iana_language = @var_default_iana_language,
                default_context = @var_default_context,
                default_mime_type = @var_default_mime_type,
                date_last_updated = GETUTCDATE()
			WHERE uri_response_id = @var_uri_response_id

            IF @@ROWCOUNT > 0
                BEGIN
                    SELECT @var_success_flag = 1
                END

            SELECT @var_uri_response_id AS uri_response_id, @var_success_flag as SUCCESS;
        END

        
END
GO
/****** Object:  StoredProcedure [dbo].[VALIDATE_Get_Batch_To_Validate]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	[VALIDATE_Get_Batch_To_Validate] starts validating entries for the provided batch_id. This procedure is
--              executed by the data entry server as soon as it has completed saving all the entries in the batch received
--              by the API into the database.
-- =============================================
CREATE PROCEDURE [dbo].[VALIDATE_Get_Batch_To_Validate]
	@batch_id int
AS

	SET NOCOUNT ON;

	SELECT 
		[member_primary_gln],
		[identification_key_type],
		[identification_key]
	FROM 
		[uri_entries_prevalid]
	WHERE batch_id = @batch_id
	AND DATEDIFF(DAY, [date_last_updated], GETDATE()) <= 7
	ORDER BY identification_key_type, identification_key
GO
/****** Object:  StoredProcedure [dbo].[VALIDATE_Get_Validation_Results]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 02 June 2020
-- Description:	[VALIDATE_Get_Validation_Results] retrieves the validation results for the given batch_id
--              as long as it was issued over the previous 7 days
-- =============================================
CREATE PROCEDURE [dbo].[VALIDATE_Get_Validation_Results]
    @var_member_primary_gln nchar(13),
	@batch_id INT 
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @var_unfinished_count INT = 0

	/* only return the results if the validation_code has been updated for every entry in the batch */
	/* Here we count how many unfinished entries there are. */
	SELECT @var_unfinished_count = COUNT(*)
	FROM [dbo].[uri_entries_prevalid] 
	WHERE [batch_id] = @batch_id
    AND [member_primary_gln] = @var_member_primary_gln
	AND validation_code = 255
	AND DATEDIFF(HOUR, [date_last_updated], GETDATE()) <= 24

	/* Only if there are no unfinished entries do we return results */
	IF @var_unfinished_count = 0
		SELECT 
			  [identification_key_type],
			  [identification_key],
			  [validation_code],
			  'N' AS PENDING
		  FROM [dbo].[uri_entries_prevalid]
		  WHERE [batch_id] = @batch_id
		  AND [member_primary_gln] = @var_member_primary_gln
		  AND validation_code < 255
		  AND DATEDIFF(HOUR, [date_last_updated], GETDATE()) <= 24
		  ORDER BY identification_key_type, identification_key
	ELSE
		/* 'Fake' a single-line outpout in the same format as the results output
		    so that calling code can see that this batch is still pending */
		SELECT
			'X' AS identification_key_type,
			'X' AS identification_key,
			255 AS validation_code,
			'Y' AS PENDING

END
GO
/****** Object:  StoredProcedure [dbo].[VALIDATE_Publish_Validated_Entries]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	Copies successfully validated entries into the primary entry tables
--              in controlled batches based on the original batch_id (in code this is limited to maximum 1000 entries).
--              'Ready to copy' rows are in uri_entries_prevalid (and associated uri_responses_prevalid) table
--              where validation_code = 0 (successful validation) and the entry has not been flagged_for_deletion.
--              The entries are copied then the flagged_for_deletion flag is set to 1.
-- =============================================
CREATE PROCEDURE [dbo].[VALIDATE_Publish_Validated_Entries]

	@var_batch_id INT
AS
BEGIN
	SET NOCOUNT ON

	DECLARE @publishCount INT = 0

	DECLARE @var_uri_entry_id_prevalid BigInt
	DECLARE @var_uri_entry_id_published BigInt
	DECLARE @var_member_primary_gln NChar(13)
	DECLARE @var_identification_key_type NVarChar(20)
	DECLARE @var_identification_key NVarChar(45)
	DECLARE @var_item_description NVarChar(2000)
	DECLARE @var_qualifier_path NVarChar(255)
	DECLARE @var_active Bit
	DECLARE @flagged_for_deletion Bit
	
	DECLARE batch_cursor CURSOR 
	FOR 
		SELECT 
			[uri_entry_id],
			[member_primary_gln],
			[identification_key_type],
			[identification_key],
			[item_description],
			[qualifier_path],
			[active],
			[flagged_for_deletion]
		FROM [uri_entries_prevalid]
		WHERE [flagged_for_deletion] = 0 
		AND [validation_code] = 0
		AND batch_id = @var_batch_id
	FOR
		UPDATE OF [flagged_for_deletion]

	OPEN batch_cursor

	FETCH NEXT FROM batch_cursor INTO
		@var_uri_entry_id_prevalid,
		@var_member_primary_gln,
		@var_identification_key_type,
		@var_identification_key,
		@var_item_description,
		@var_qualifier_path,
		@var_active,
		@flagged_for_deletion

	WHILE @@FETCH_STATUS = 0
	BEGIN
		EXEC UPSERT_URI_Entry 
			@var_member_primary_gln, 
			@var_identification_key_type, 
			@var_identification_key, 
			@var_item_description, 
			@var_qualifier_path, 
			@var_active, 
			@var_output_uri_entry_id = @var_uri_entry_id_published OUTPUT

		IF @var_uri_entry_id_published > 0
			EXEC VALIDATE_Publish_Validated_Responses @var_uri_entry_id_prevalid, @var_uri_entry_id_published

		UPDATE [uri_entries_prevalid]
		SET [flagged_for_deletion] = 1 
		WHERE CURRENT OF batch_cursor

		/* Increment counter */
		SELECT @publishCount = @publishCount + 1

		/* fetch the next entry from the cursoer, if any */
		FETCH NEXT FROM batch_cursor INTO
			@var_uri_entry_id_prevalid,
			@var_member_primary_gln,
			@var_identification_key_type,
			@var_identification_key,
			@var_item_description,
			@var_qualifier_path,
			@var_active,
			@flagged_for_deletion
	END
	
	CLOSE batch_cursor
	DEALLOCATE batch_cursor

	SELECT @publishCount as entriesPublishedCount

END
GO
/****** Object:  StoredProcedure [dbo].[VALIDATE_Publish_Validated_Responses]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 03-JUN-2020
-- Description:	Copies responses of successfully validated entries into the primary entry tables
--              The 'prevalid' uri_entry_id is needed, and so is the published uri_entry_id from the uri_entries table.
--              The responses entries are copied then the flagged_for_deletion flag is set to 1.
-- =============================================
CREATE PROCEDURE [dbo].[VALIDATE_Publish_Validated_Responses]

	@var_uri_entry_id_prevalid INT,
	@var_uri_entry_id_published INT
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @var_uri_response_id BigInt
	DECLARE @var_linktype NVarChar(100)
	DECLARE @var_iana_language NVarChar(45)
	DECLARE @var_context NVarChar(100)
	DECLARE @var_mime_type NVarChar(45)
	DECLARE @var_link_title NVarChar(45)
	DECLARE @var_target_url NVarChar(1024)
	DECLARE @var_default_linktype Bit
	DECLARE @var_default_iana_language Bit
	DECLARE @var_default_context Bit
	DECLARE @var_default_mime_type Bit
	DECLARE @var_forward_request_querystrings Bit
	DECLARE @var_active Bit
	DECLARE @flagged_for_deletion Bit

	/* Declare a cursor that will retrieve the 1 or more responses for the given @var_uri_entry_id_prevalid */
	DECLARE response_entry_cursor CURSOR 
	FOR 
		SELECT 
			[uri_response_id],
			[linktype],
			[iana_language],
			[context],
			[mime_type],
			[link_title],
			[target_url],
			[default_linktype],
			[default_iana_language],
			[default_context],
			[default_mime_type],
			[forward_request_querystrings],
			[active],
			[flagged_for_deletion]
		FROM [uri_responses_prevalid]
		WHERE uri_entry_id = @var_uri_entry_id_prevalid
		AND flagged_for_deletion = 0
	FOR
		UPDATE OF [flagged_for_deletion]
 
	OPEN response_entry_cursor

	FETCH NEXT FROM response_entry_cursor INTO
			@var_uri_response_id,
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
			@var_active,
			@flagged_for_deletion

	WHILE @@FETCH_STATUS = 0
	BEGIN
		/* Update the main URI_Responses table with the validated row */
		EXEC UPSERT_URI_Response 
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

		/* Update the uri_responses_prevalid table to flag it for future deletion */
		UPDATE [uri_responses_prevalid]
			SET flagged_for_deletion = 1
			WHERE CURRENT OF response_entry_cursor

		/* Fetch the next response, if any */
		FETCH NEXT FROM response_entry_cursor INTO
			@var_uri_response_id,
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
			@var_active,
			@flagged_for_deletion

	END
	
	CLOSE response_entry_cursor
	DEALLOCATE response_entry_cursor
END
GO
/****** Object:  StoredProcedure [dbo].[VALIDATE_Save_Validation_Result]    Script Date: 12/08/2020 13:39:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Nick Lansley
-- Create date: 18-Feb-2020
-- Description:	[VALIDATE_Save_Validation_Result] saves the result of the validation to the [uri_entries_prevalid] table.
-- =============================================
CREATE PROCEDURE [dbo].[VALIDATE_Save_Validation_Result]
	@member_primary_gln NChar(13),
	@identification_key_type nvarchar(20),
	@identification_key nvarchar(45),
	@validation_code tinyint
AS
BEGIN
    SET  XACT_ABORT  ON
    SET  NOCOUNT  ON

    DECLARE @var_success_flag bit = 0

	UPDATE [uri_entries_prevalid]
	SET 
		[validation_code]= @validation_code,
		[date_last_updated] = GETDATE()
	WHERE 
		[member_primary_gln] = @member_primary_gln AND
		[identification_key_type] = @identification_key_type AND
		[identification_key] = @identification_key


	IF @@ROWCOUNT > 0
        SELECT @var_success_flag = 1

	SELECT @var_success_flag as SUCCESS

END
GO

SELECT 'Database Create Script Completed' as message