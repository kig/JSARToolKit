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
FLARSquare = NyARSquare;
Cxdir = new IntVector([0,1,1,1,0,-1,-1,-1]);
Cydir = new IntVector([-1,-1,0,1,1,1,0,-1]);
FLContourPickup = ASKlass('FLContourPickup', NyARContourPickup,
{
  FLContourPickup : function()
  {
  }
  ,getContour_FLARBinRaster : function(i_raster,i_entry_x,i_entry_y,i_array_size,o_coord_x,o_coord_y)
  {
    var xdir = this._getContour_xdir;// static int xdir[8] = { 0, 1, 1, 1, 0,-1,-1,-1};
    var ydir = this._getContour_ydir;// static int ydir[8] = {-1,-1, 0, 1, 1, 1, 0,-1};
    var i_buf=i_raster.getBuffer();
    var width=i_raster.getWidth();
    var height=i_raster.getHeight();
    //クリップ領域の上端に接しているポイントを得る。
    var coord_num = 1;
    o_coord_x[0] = i_entry_x;
    o_coord_y[0] = i_entry_y;
    var dir = 5;
    var c = i_entry_x;
    var r = i_entry_y;
    for (;;) {
      dir = (dir + 5) % 8;//dirの正規化
      //ここは頑張ればもっと最適化できると思うよ。
      //4隅以外の境界接地の場合に、境界チェックを省略するとかね。
      if(c>=1 && c<width-1 && r>=1 && r<height-1){
        for(;;){//gotoのエミュレート用のfor文
          //境界に接していないとき(暗点判定)
          if (i_buf.getPixel(c + xdir[dir], r + ydir[dir]) >0) {
            break;
          }
          dir++;
          if (i_buf.getPixel(c + xdir[dir], r + ydir[dir]) >0) {
            break;
          }
          dir++;
          if (i_buf.getPixel(c + xdir[dir], r + ydir[dir]) >0) {
            break;
          }
          dir++;
          if (i_buf.getPixel(c + xdir[dir], r + ydir[dir]) >0) {
            break;
          }
          dir++;
          if (i_buf.getPixel(c + xdir[dir], r + ydir[dir]) >0) {
            break;
          }
          dir++;
          if (i_buf.getPixel(c + xdir[dir], r + ydir[dir]) >0) {
            break;
          }
          dir++;
          if (i_buf.getPixel(c + xdir[dir], r + ydir[dir]) >0) {
            break;
          }
          dir++;
          if (i_buf.getPixel(c + xdir[dir], r + ydir[dir]) >0) {
            break;
          }
          //8方向全て調べたけどラベルが無いよ？
          return -1;
        }
      }else{
        //境界に接しているとき
        var i;
        for (i = 0; i < 8; i++){
          var x=c + xdir[dir];
          var y=r + ydir[dir];
          //境界チェック
          if(x>=0 && x<width && y>=0 && y<height){
            if (i_buf.getPixel(y, x) >0) {
              break;
            }
          }
          dir++;//倍長テーブルを参照するので問題なし
        }
        if (i == 8) {
          //8方向全て調べたけどラベルが無いよ？
          return -1;
        }
      }
      dir=dir% 8;//dirの正規化
      // xcoordとycoordをc,rにも保存
      c = c + xdir[dir];
      r = r + ydir[dir];
      o_coord_x[coord_num] = c;
      o_coord_y[coord_num] = r;
      // 終了条件判定
      if (c == i_entry_x && r == i_entry_y){
        coord_num++;
        break;
      }
      coord_num++;
      if (coord_num == i_array_size) {
        //輪郭が末端に達した
        return coord_num;
      }
    }
    return coord_num;
  }
})

FLARSquareContourDetector = ASKlass('FLARSquareContourDetector', NyARSquareContourDetector,
{
  AR_AREA_MAX : 100000// #define AR_AREA_MAX 100000
  ,AR_AREA_MIN : 70// #define AR_AREA_MIN 70
  ,_width : 0
  ,_height : 0
  ,_labeling : null
  ,_overlap_checker : new NyARLabelOverlapChecker(32)
  ,_cpickup : new FLContourPickup()
  ,_stack : null
  ,_coord2vertex : new NyARCoord2SquareVertexIndexes()
  ,_max_coord : 0
  ,_xcoord : null
  ,_ycoord : null
  /**
   * 最大i_squre_max個のマーカーを検出するクラスを作成する。
   *
   * @param i_param
   */
  ,FLARSquareContourDetector : function(i_size)
  {
    this._width = i_size.w;
    this._height = i_size.h;
    //ラベリングのサイズを指定したいときはsetAreaRangeを使ってね。
    this._labeling = new NyARLabeling_Rle(this._width,this._height);
    this._stack=new NyARRleLabelFragmentInfoStack(i_size.w*i_size.h*2048/(320*240)+32);//検出可能な最大ラベル数
    // 輪郭の最大長は画面に映りうる最大の長方形サイズ。
    var number_of_coord= (this._width + this._height) * 2;
    // 輪郭バッファ
    this._max_coord = number_of_coord;
    this._xcoord = new IntVector(number_of_coord);
    this._ycoord = new IntVector(number_of_coord);
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
    this._labeling.setAreaRange(i_max, i_min);
  }
  ,__detectMarker_mkvertex : new IntVector(4)
  ,detectMarkerCB : function(i_raster ,i_callback)
  {
    var flagment=this._stack;
    var overlap = this._overlap_checker;
    // ラベル数が0ならここまで
    var label_num=this._labeling.labeling(i_raster, flagment);
    if (label_num < 1) {
      return;
    }
    //ラベルをソートしておく
    flagment.sortByArea();
    //ラベルリストを取得
    var labels=flagment.getArray();
    var xsize = this._width;
    var ysize = this._height;
    var xcoord = this._xcoord;
    var ycoord = this._ycoord;
    var coord_max = this._max_coord;
    var mkvertex =this.__detectMarker_mkvertex;
    //重なりチェッカの最大数を設定
    overlap.setMaxLabels(label_num);
    for (var i=0; i < label_num; i++) {
      var label_pt=labels[i];
      var label_area = label_pt.area;
      // クリップ領域が画面の枠に接していれば除外
      if (label_pt.clip_l == 0 || label_pt.clip_r == xsize-1){
        continue;
      }
      if (label_pt.clip_t == 0 || label_pt.clip_b == ysize-1){
        continue;
      }
      // 既に検出された矩形との重なりを確認
      if (!overlap.check(label_pt)) {
        // 重なっているようだ。
        continue;
      }
      if (window.DEBUG) {
        var cv = document.getElementById('debugCanvas').getContext('2d');
        cv.strokeStyle = 'red';
        cv.strokeRect(label_pt.clip_l, label_pt.clip_t, label_pt.clip_r-label_pt.clip_l, label_pt.clip_b-label_pt.clip_t);
        cv.fillStyle = 'red';
        cv.fillRect(label_pt.entry_x-1, label_pt.clip_t-1, 3,3);
        cv.fillStyle = 'cyan';
        cv.fillRect(label_pt.pos_x-1, label_pt.pos_y-1, 3,3);
      }
      //輪郭を取得
      var coord_num = this._cpickup.getContour_FLARBinRaster(i_raster,label_pt.entry_x,label_pt.clip_t, coord_max, xcoord, ycoord);
      if (coord_num == -1) return -1;
      if (coord_num == coord_max) {
        // 輪郭が大きすぎる。
        continue;
      }
      //輪郭線をチェックして、矩形かどうかを判定。矩形ならばmkvertexに取得
      var v = this._coord2vertex.getVertexIndexes(xcoord, ycoord,coord_num,label_area, mkvertex);
      if (!v) {
        // 頂点の取得が出来なかった
        continue;
      }
      //矩形を発見したことをコールバック関数で通知
      i_callback.onSquareDetect(this,xcoord,ycoord,coord_num,mkvertex);
      // 検出済の矩形の属したラベルを重なりチェックに追加する。
      overlap.push(label_pt);
    }
    return;
  }
})

