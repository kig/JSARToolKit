files = [];

Dir["src/*.js"].sort.each{|js|
  lines = File.readlines(js)
  class_lines = lines.grep(/Klass| [A-Z][^\.\(;\s]+[\.\(;]|^\}\)$/).reject{|f| f =~ /\s*\*/}
  objs = []
  cobj = nil
  class_lines.each{|cl|
    cl.gsub!(/"[^"]+"/, "")
    if cl =~ /^\}\)/
      objs.push(cobj) if cobj
      cobj = nil
    elsif cl =~ /^\S+ =/
      cname,rest = cl.split(" ",2)
      objs.push(cobj) if cobj
      cobj = [cname, rest.scan(/\b[A-Z][a-zA-Z0-9_]+/)]
    elsif cobj
      cobj[1].push(*cl.scan(/\b[A-Z][a-zA-Z0-9_]+/))
    else
      cobj = [nil, cl.scan(/\b[A-Z][a-zA-Z0-9_]+/)]
    end
  }
  objs.push(cobj) if cobj
  objs.each{|c| c[1].uniq! }
  classes = objs.map{|c| c[0] }.compact.uniq.sort
  constructors = classes.map{|c| lines.grep(/#{c} : function/) }.flatten.compact
  constructors.map!{|c| c.gsub(/^\s*\*?\s*,?| : function/,'') }.reject{|c|c =~ /^[a-z]/ }
  files.push({
    :file => js,
    :deps => objs.map{|c| c[1] }.flatten.sort.uniq - classes,
    :provides => classes,
    :constructors => constructors,
    :class_deps => objs
  })
}
def compare_files(a,b)
  return 0 if a == b
  b_needs_a = (b[:deps] - a[:provides]).length < b[:deps].length
  a_needs_b = (a[:deps] - b[:provides]).length < a[:deps].length
  if b_needs_a and a_needs_b
    puts "Conflict between #{a[:file]} and #{b[:file]}"
    0
  elsif a_needs_b
    1
  elsif b_needs_a
    -1
  else
    0
  end
end
def sort_by_deps(files)
  sfiles = []
  while files.length > 0
    m = files.find{|f| files.all?{|g| compare_files(f,g) < 1 } }
    raise "no find" unless m
    files.delete(m)
    sfiles.push(m)
  end
  sfiles
end
files = sort_by_deps(files)

puts( files.map{|f| "<script src=\"#{f[:file]}\"></script>" } )
puts("<script>\n#{files.map{|f| f[:constructors].map{|c| "new #{c}"} }.flatten.sort.uniq.join("")}</script>")
