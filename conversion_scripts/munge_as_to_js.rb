license = <<ENDL
/*
 * PROJECT: NyARToolkitAS3
 * --------------------------------------------------------------------------------
 * This work is based on the original ARToolKit developed by
 *   Hirokazu Kato
 *   Mark Billinghurst
 *   HITLab, University of Washington, Seattle
 * http://www.hitl.washington.edu/artoolkit/
 *
 * The NyARToolkitAS3 is AS3 edition ARToolKit class library.
 * Copyright (C)2010 Ryo Iizuka
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * For further information please contact.
 *  http://nyatla.jp/nyatoolkit/
 *  <airmail(at)ebony.plala.or.jp> or <nyatla(at)nyatla.jp>
 *
 */
ENDL
license.strip!
new_license = <<ENDL
/*
 * JSARToolkit
 * --------------------------------------------------------------------------------
 * This work is based on the original ARToolKit developed by
 *   Hirokazu Kato
 *   Mark Billinghurst
 *   HITLab, University of Washington, Seattle
 * http://www.hitl.washington.edu/artoolkit/
 *
 * And the NyARToolkitAS3 ARToolKit class library.
 *   Copyright (C)2010 Ryo Iizuka
 *
 * JSARToolkit is a JavaScript port of NyARToolkitAS3.
 *   Copyright (C)2010 Ilmari Heikkinen
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * For further information please contact.
 *  ilmari.heikkinen@gmail.com
 *
 */
ENDL
new_license.strip!

Dir["*.as"].each do |fn|
  s = File.read(fn)
  s.gsub!(/\s+$/, "")
  s.gsub!(/\t/, "  ")
  s.sub!(license, new_license)
  s.gsub!(license, "")
  s.gsub!(/^\{/, "")
  s.gsub!(/^\}/, "")
  s.gsub!(/^\s*package .*/, "")
  s.gsub!(/^  /, "")
  s.gsub!(/^\}/, "})")
  s.gsub!(/^\s*import .*/, "")
  s.gsub!(/^\s*(final )?(public |private |protected )?(static )?(internal ?)(class|interface) (\S+)/, "\\5 = ASKlass('\\5',")
  s.gsub!(/^\s*import .*/, "")
  s.gsub!(/ extends\s+(\S+)/, " \\1,")
  s.gsub!(/ implements\s+(\S+)/, "")
  s.gsub!(/(final )?(public|private|protected) (final )?(static )?(var|const) ([^;]+);/){|m|
    k = $6
    if k.include?("=")
      name,value = k.strip.split(/\s*=\s*/,2)
      ",#{name} : #{value}"
    elsif k =~ /:(Number|int|float|[dD]ouble)$/
      ",#{k} : 0"
    else
      ",#{k} : null"
    end
  }
  s.gsub!(/([a-zA-Z0-9_\[\]\(\)]+):[a-zA-Z0-9_\.<>]+/, "\\1")
  s.gsub!(/((final )?(public|private|protected) (final )?(override )?(static )?)?function ([^\(]+)/, ",\\7 : function")
  s.gsub!(/\bVector\.<Vector.<[^>]+>>/, "Array")
  s.gsub!(/\bVector\.<Number>/, "FloatVector")
  s.gsub!(/\bVector\.<int>/, "IntVector")
  s.gsub!(/\bVector\.<[^>]+>/, "Array")
  s.gsub!(/(function\s*\([^\)]*\))\s*;/, "\\1{},")
  s.gsub!(/,(\s*(\/\/[^\n]*\n|\/\*([^*]*\*[^\/])+[^*]*\*\/)*\s*),/m, ",\\1")
  s.gsub!(/\{(\s*(\/\/[^\n]*\n|\/\*([^*]*\*[^\/])+[^*]*\*\/)*\s*),/m, "{\\1")
  s.gsub!(/\,(\s*(\/\/[^\n]*\n|\/\*([^*]*\*[^\/])+[^*]*\*\/)*\s*)\}/m, "\\1}")
  s.gsub!(/\[(\s*(\/\/[^\n]*\n|\/\*([^*]*\*[^\/])+[^*]*\*\/)*\s*),/m, "[\\1")
  s.gsub!(/\,(\s*(\/\/[^\n]*\n|\/\*([^*]*\*[^\/])+[^*]*\*\/)*\s*)\]/m, "\\1]")
  File.open(fn.sub(/as$/,"js"), "w"){|f| f.write s }
end

