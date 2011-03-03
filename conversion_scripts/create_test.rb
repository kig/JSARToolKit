s=`ruby parse_order.rb`
File.open("test.html", 'w'){|f|
  f.write("<html><head>#{s}</head></html>")
}
