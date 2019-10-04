<?php
/**
 * Created by IntelliJ IDEA.
 * User: nick
 * Date: 2018-12-20
 * Time: 13:35
 */

class ClassHTMLPageBuilder
{
    public function BuildPageTemp($gs1Key)
    {
        return file_get_contents(dirname(__FILE__) . "/templates/$gs1Key.html");
    }

    public function BuildPage($gs1Key, $gs1Value, $resolverDocument, $uri, $queryString)
    {
        $itemName = 'to be developed';
        $template = file_get_contents(dirname(__FILE__) . '/templates/' . strtolower($gs1Key) . '.html');
        //Copy the template that will be used for index.html
        $thisTemplate = $template;

        $jsonEncodedResolverDocument = json_encode($resolverDocument, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $jsonEncodedResolverDocument = str_replace('\u03b1', 'base_product', $jsonEncodedResolverDocument);
        $jsonEncodedResolverDocument = str_replace('"active": "1",', '', $jsonEncodedResolverDocument);

        //replace all template's uri request variable placeholders with the column name
        $thisTemplate = str_replace('[resolver_document]', $jsonEncodedResolverDocument, $thisTemplate);
        $thisTemplate = str_replace('[gs1_key]', $gs1Key, $thisTemplate);
        $thisTemplate = str_replace('[gs1_value]', $gs1Value, $thisTemplate);
        $thisTemplate = str_replace('[item_name]', $itemName, $thisTemplate);

        return $thisTemplate;
    }

}