/*
 * PROJECT: FLARToolKit
 * --------------------------------------------------------------------------------
 * This work is based on the NyARToolKit developed by
 *   R.Iizuka (nyatla)
 * http://nyatla.jp/nyatoolkit/
 *
 * The FLARToolKit is ActionScript 3.0 version ARToolkit class library.
 * Copyright (C)2008 Saqoosha
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
 *  http://www.libspark.org/wiki/saqoosha/FLARToolKit
 *  <saq(at)saqoosha.net>
 *
 */
FLARLabeling = ASKlass('FLARLabeling',
{
  AR_AREA_MAX : 100000// #define AR_AREA_MAX 100000
  ,AR_AREA_MIN : 70// #define AR_AREA_MIN 70
  ,ZERO_POINT : new Point()
  ,ONE_POINT : new Point(1, 1)
  ,hSearch : null
  ,hLineRect : null
  ,_tmp_bmp : null
  ,areaMax : 0
  ,areaMin : 0
  ,FLARLabeling : function(i_width,i_height)
  {
    this._tmp_bmp = new BitmapData(i_width, i_height, false,0x00);
    this.hSearch = new BitmapData(i_width, 1, false, 0x000000);
    this.hLineRect = new Rectangle(0, 0, 1, 1);
    this.setAreaRange(this.AR_AREA_MAX, this.AR_AREA_MIN);
    return;
  }
  /**
   * 白領域の検査対象サイズ
   *  最大サイズは 一辺約320px、最小サイズは 一辺約 8px まで解析対象としている
   *  解析画像中で上記範囲内であれば解析対象となるが、最小サイズは小さすぎて意味をなさない。
   *
   * @param i_max 解析対象とする白領域の最大pixel数(一辺の二乗)
   * @param i_min 解析対象とする白領域の最小pixel数(一辺の二乗)
   */
  ,setAreaRange : function(i_max, i_min)
  {
    this.areaMax=i_max;
    this.areaMin=i_min;
  }
  ,labeling : function(i_bin_raster,o_stack)
  {
    var label_img = this._tmp_bmp;
    label_img.fillRect(label_img.rect, 0x0);
    var rect = label_img.rect.clone();
    rect.inflate(-1, -1);
    label_img.copyPixels(i_bin_raster.getBuffer(), rect, this.ONE_POINT);
    var currentRect = label_img.getColorBoundsRect(0xffffff, 0xffffff, true);
    var hLineRect = this.hLineRect;
    hLineRect.y = 0;
    hLineRect.width = label_img.width;
    var hSearch = this.hSearch;
    var hSearchRect;
    var labelRect;
    var index = 0;
    var label;
    o_stack.clear();
//     try {
      while (!currentRect.isEmpty()) {
        hLineRect.y = currentRect.top;
        hSearch.copyPixels(label_img, hLineRect, this.ZERO_POINT);
        hSearchRect = hSearch.getColorBoundsRect(0xffffff, 0xffffff, true);
        label_img.floodFill(hSearchRect.x, hLineRect.y, ++index);
        labelRect = label_img.getColorBoundsRect(0xffffff, index, true);
        label = o_stack.prePush();
        var area = labelRect.width * labelRect.height;
        //エリア規制
        if (area <= this.areaMax && area >= this.areaMin){
          label.area = area;
          label.clip_l = labelRect.left;
          label.clip_r = labelRect.right - 1;
          label.clip_t = labelRect.top;
          label.clip_b = labelRect.bottom - 1;
          label.pos_x = (labelRect.left + labelRect.right - 1) * 0.5;
          label.pos_y = (labelRect.top + labelRect.bottom - 1) * 0.5;
          //エントリ・ポイントを探す
          label.entry_x=this.getTopClipTangentX(label_img,index,label);
          if (label.entry_x == -1) {
            return -1;
          }
        }else {
          o_stack.pop();
        }
        currentRect = label_img.getColorBoundsRect(0xffffff, 0xffffff, true);
      }
/*    } catch (e) {
      throw("too many labeled area!! gave up")
      console.log('Too many labeled area!! gave up....',e);
    }*/
    return o_stack.getLength();
  }
  ,getTopClipTangentX : function(i_image, i_index, i_label)
  {
    var w;
    var clip1 = i_label.clip_r;
    var i;
    for (i = i_label.clip_l; i <= clip1; i++) { // for( i = clip[0]; i <=clip[1]; i++, p1++ ) {
      w = i_image.getPixel(i, i_label.clip_t);
      if (w > 0 && w == i_index) {
        return i;
      }
    }
    //あれ？見つからないよ？
    return -1;
  }
})
