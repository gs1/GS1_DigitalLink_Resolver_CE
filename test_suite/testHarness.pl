#!/usr/bin/perl
use cPanelUserConfig;
use CGI::Carp qw(fatalsToBrowser);
use strict;
use utf8;
use LWP::UserAgent;

############################################################################
# Functions for GS1 Digital Link Test Suite
############################################################################

######### We're going to need a User Agent
use constant UAstring => 'GS1_Resolver_Test/0.1';
my $browser= LWP::UserAgent-> new();
$browser->requests_redirectable([]); #(suppress all redirects, we want the resolver's response, not the target's)

# We want to pass on the request headers received from the calling application
# Make no assumptions about what the values should be. If no value is set by the client, don't set it here (so default is null).
my @reqHeaders = ();
if ($ENV{'HTTP_USER_AGENT'}) {
  push(@reqHeaders, 'User-Agent' => $ENV{'HTTP_USER_AGENT'});
}
if ($ENV{'HTTP_ACCEPT'}) {
  push(@reqHeaders, 'Accept' => $ENV{'HTTP_ACCEPT'});
}
if ($ENV{'HTTP_ACCEPT_LANGUAGE'}) {
  push(@reqHeaders, 'Accept-language' => $ENV{'HTTP_ACCEPT_LANGUAGE'});
}

my %h = &parseQuery($ENV{'QUERY_STRING'});

my $text;

print "Content-type: application/json\n\n";

if ($h{'test'}) { # So we have a test to carry out
  if (($h{'test'} eq 'getHTTPversion') && ($h{'testVal'})) {
    $text = '{"test":"'.$h{'test'}.'","testVal":"'.$h{'testVal'}.'","result":"';
    $text .= getHTTPversion($h{'testVal'});
    $text .= '"}';
  } elsif (($h{'test'} eq 'getAllHeaders') && ($h{'testVal'})) {
    $text = '{"test":"'.$h{'test'}.'","testVal":"'.$h{'testVal'}.'","result":';
    $text .= getAllHeaders($h{'testVal'});
    $text =~ s/(.*),$/$1/;  # Remove final comma
    $text .= '}}';
  }
} else {
    $text .= "No command received\n";
}


print $text;


## Helper functions ##

sub parseQuery {
  my $query = $_[0];
  my @pairs = split('&', $query);
  my $name;
  my $value;
  my @h;
  foreach (@pairs) {
    ($name, $value) = split(/=/, $_);
    push (@h, $name, url_decode($value));
  }
  return @h;
}


sub url_decode {
  my $r = shift;
  $r =~ tr/\+/ /;
  $r =~ s/%([a-f0-9][a-f0-9])/chr( hex( $1 ) )/gei;
  return $r;
}

sub getHTTPversion {
  $_ = shift;
  my $domain = "http://".$_;
  my $curlResponse = `curl -I $domain`;
  $curlResponse =~ /HTTP\/(\d\.\d).*/;
  return $1;
}

sub getAllHeaders {
  my $uri = shift;
#  my $accept = shift;
#  my $acceptLang = shift;

  my $response = $browser->head($uri, @reqHeaders);		# Do head request
#  die "Hmm, error \"", $response->status_line(), "\" when getting $uri" unless $response->is_success(); # We do't actually want to fail on non 2xx codes
  my @headersObject = $response->headers();
  my $text = "{";
  $text .= '"httpCode":"'.$response->code().'",';   # We want the HTTP codes in our result object, even though they're not actual HTTP headers
  $text .= '"httpMsg":"'.$response->message().'",';
  $text .= '"requestURI":"'.$ENV{'QUERY_STRING'}.'",';
  $text .= '"Requesting_User_Agent":"'.$ENV{'HTTP_USER_AGENT'}.'",';
  $text .= '"Requesting_Accept_Header":"'.$ENV{'HTTP_ACCEPT'}.'",';
  $text .= '"Requesting_Accept_Language":"'.$ENV{'HTTP_ACCEPT_LANGUAGE'}.'",';
  foreach my $h (@headersObject) {
    for my $header (keys %$h) {
      if (ref($h->{$header}) eq 'ARRAY') {  # This happens if the server sends multiple headers of the same type, which seems to be allowed :-(
        $text .= '"'.$header.'":';
        $text .= '[';
        my $i = 0;
        while ($h->{$header}[$i] ne '') {
          $h->{$header}[$i] =~s/"/\\"/g;    # espace any " characters
          $text .= '"'.$h->{$header}[$i].'",';
          $i++;
        }
        $text =~ s/(.*),$/$1/;    # removes final comma
        $text .= '],';
      } else {
        $h->{$header} =~s/"/\\"/g;
        $text .= '"'.$header.'":"'.$h->{$header}.'",';
      }
    }
  }
  return $text;
}


###########################################


# A little function useful for debugging

sub showAllHeaders {
  my $uri = shift;
  my $response = $browser->head($uri, @reqHeaders);		# Do head request
  die "Hmm, error \"", $response->status_line(), "\" when getting $uri" unless $response->is_success();
  my @headersObject = $response->headers();
  my $text = "Headers for $uri are:\n\n";
  foreach my $h (@headersObject) {
    for my $header (keys %$h) {
      $text .= "$header=$h->{$header}\n\n";
    }
  }
  return $text;
}
