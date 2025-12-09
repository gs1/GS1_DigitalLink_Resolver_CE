from flask_restx import fields

def register_request_models(namespace):
  new_document_link_model = namespace.model('NewDocumentLink', {
      'linktype': fields.String(
          required=True,
          description='GS1 linktype value.',
          example='gs1:pip'
      ),
      'href': fields.String(
          required=True,
          description='Target URL that the Digital Link should resolve to.',
          example='https://example.com/products/09506000134369'
      ),
      'title': fields.String(
          required=True,
          description='Human-readable title for this link.',
          example='Product information page'
      ),
      'type': fields.String(
          required=False,
          description='MIME type of the target resource.',
          example='text/html'
      ),
      'hreflang': fields.List(
          fields.String,
          required=True,
          description='List of language tags (BCP-47) for which this link is applicable.',
          example=['en']
      ),
      'context': fields.List(
          fields.String,
          required=False,
          description='Optional list of context tags.',
          example=['consumer', 'online']
      ),
  })

  new_document_model = namespace.model('NewDocument', {
      'anchor': fields.String(
          required=True,
          description=(
              'GS1 Digital Link path for the primary identifier and optional qualifiers. The value MUST start with "/".'
          ),
          example='/01/09506000134369'
      ),
      'itemDescription': fields.String(
          required=True,
          description='Free-text description of the identified item.',
          example='Water Bottle 500 ml'
      ),
      'defaultLinktype': fields.String(
          required=True,
          description=(
              'Linktype that should be used as the default when no explicit linktype is requested by the client.'
          ),
          example='gs1:pip'
      ),
      'qualifiers': fields.List(
          fields.Raw,
          required=False,
          description=(
              'Optional list of qualifier key/value pairs. Each element is a one-entry object whose key is an AI code and whose value is the AI value.'
          ),
          example=[
              {"10": "{lotnumber}"}, 
              {"21": "{serialnumber}"}
          ]
      ),
      'links': fields.List(
          fields.Nested(new_document_link_model),
          required=True,
          description='List of links associated with this anchor.'
      ),
  })

  return new_document_model, new_document_link_model
