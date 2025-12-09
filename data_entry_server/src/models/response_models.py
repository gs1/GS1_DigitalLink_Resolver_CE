from flask_restx import fields

def register_response_models(namespace):
  new_document_result_model = namespace.model('NewDocumentResult', {
      'response_status': fields.Integer(
          required=True,
          description='HTTP status code of the operation.',
          example=200
      ),
      'data': fields.String(
          required=True,
          description='Human-readable message of the operation result.',
          example='Document with anchor 01_09506000134369 updated successfully'
      )
  })

  new_document_response_item_model = namespace.model('NewDocumentResponseItem', {
      'entry': fields.String(
          required=True,
          description='Document entry identifier (anchor id).',
          example='01_09506000134369'
      ),
      'qualifiers': fields.List(
          fields.Raw,
          required=False,
          description='List of qualifier key/value pairs (present on update).',
          example=[
              {"10": "{lotnumber}"},
              {"21": "{serialnumber}"}
          ]
      ),
      'result': fields.Nested(
          new_document_result_model,
          required=True,
          description='Result metadata of the operation.'
      )
  })

  return new_document_response_item_model
