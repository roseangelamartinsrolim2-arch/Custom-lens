Dim http, url, result
url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=flower"

Set http = CreateObject("MSXML2.XMLHTTP")
http.Open "GET", url, False
http.Send

If http.Status = 200 Then
    result = http.responseText
    MsgBox "Resposta da API: " & result
Else
    MsgBox "Erro HTTP: " & http.Status
End If

Set http = Nothing
