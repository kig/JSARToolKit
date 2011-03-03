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
NyARContourPickup = ASKlass('NyARContourPickup',
{
  //巡回参照できるように、テーブルを二重化
  //                                           0  1  2  3  4  5  6  7   0  1  2  3  4  5  6
  _getContour_xdir : new IntVector([0, 1, 1, 1, 0, -1, -1, -1 , 0, 1, 1, 1, 0, -1, -1]),
  _getContour_ydir : new IntVector([-1,-1, 0, 1, 1, 1, 0,-1 ,-1,-1, 0, 1, 1, 1, 0]),
  getContour_NyARBinRaster : function(i_raster,i_entry_x,i_entry_y,i_array_size,o_coord_x,o_coord_y)
  {
    return this.impl_getContour(i_raster,0,i_entry_x,i_entry_y,i_array_size,o_coord_x,o_coord_y);
  }
  /**
   *
   * @param i_raster
   * @param i_th
   * 画像を２値化するための閾値。暗点&lt;=i_th&lt;明点となります。
   * @param i_entry_x
   * 輪郭の追跡開始点を指定します。
   * @param i_entry_y
   * @param i_array_size
   * @param o_coord_x
   * @param o_coord_y
   * @return
   * @throws NyARException
   */
  ,getContour_NyARGrayscaleRaster : function(i_raster,i_th,i_entry_x,i_entry_y,i_array_size,o_coord_x,o_coord_y)
  {
    return this.impl_getContour(i_raster,i_th,i_entry_x,i_entry_y,i_array_size,o_coord_x,o_coord_y);
  }
  /**
   * ラスタのエントリポイントから辿れる輪郭線を配列に返します。
   * @param i_raster
   * @param i_th
   * 暗点<=th<明点
   * @param i_entry_x
   * @param i_entry_y
   * @param i_array_size
   * @param o_coord_x
   * @param o_coord_y
   * @return
   * 輪郭線の長さを返します。
   * @throws NyARException
   */
  ,impl_getContour : function(i_raster,i_th,i_entry_x,i_entry_y,i_array_size,o_coord_x,o_coord_y)
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
          if (i_buf[(r + ydir[dir])*width+(c + xdir[dir])] <= i_th) {
            break;
          }
          dir++;
          if (i_buf[(r + ydir[dir])*width+(c + xdir[dir])] <= i_th) {
            break;
          }
          dir++;
          if (i_buf[(r + ydir[dir])*width+(c + xdir[dir])] <= i_th) {
            break;
          }
          dir++;
          if (i_buf[(r + ydir[dir])*width+(c + xdir[dir])] <= i_th) {
            break;
          }
          dir++;
          if (i_buf[(r + ydir[dir])*width+(c + xdir[dir])] <= i_th) {
            break;
          }
          dir++;
          if (i_buf[(r + ydir[dir])*width+(c + xdir[dir])] <= i_th) {
            break;
          }
          dir++;
          if (i_buf[(r + ydir[dir])*width+(c + xdir[dir])] <= i_th) {
            break;
          }
          dir++;
          if (i_buf[(r + ydir[dir])*width+(c + xdir[dir])] <= i_th) {
            break;
          }
/*
          try{
            BufferedImage b=new BufferedImage(width,height,ColorSpace.TYPE_RGB);
            NyARRasterImageIO.copy(i_raster, b);
          ImageIO.write(b,"png",new File("bug.png"));
          }catch(Exception e){
          }*/
          //8方向全て調べたけどラベルが無いよ？
          throw new NyARException();
        }
      }else{
        //境界に接しているとき
        var i;
        for (i = 0; i < 8; i++){
          var x=c + xdir[dir];
          var y=r + ydir[dir];
          //境界チェック
          if(x>=0 && x<width && y>=0 && y<height){
            if (i_buf[(y)*width+(x)] <= i_th) {
              break;
            }
          }
          dir++;//倍長テーブルを参照するので問題なし
        }
        if (i == 8) {
          //8方向全て調べたけどラベルが無いよ？
          throw new NyARException();// return(-1);
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
NyARCoord2Linear = ASKlass('NyARCoord2Linear',
{
  _xpos : null,
  _ypos : null,
  _pca : null,
  __getSquareLine_evec : new NyARDoubleMatrix22(),
  __getSquareLine_mean : new FloatVector(2),
  __getSquareLine_ev : new FloatVector(2),
  _dist_factor : null,
  NyARCoord2Linear : function(i_size,i_distfactor_ref)
  {
    //歪み計算テーブルを作ると、8*width/height*2の領域を消費します。
    //領域を取りたくない場合は、i_dist_factor_refの値をそのまま使ってください。
    this._dist_factor = new NyARObserv2IdealMap(i_distfactor_ref,i_size);
    // 輪郭バッファ
    this._pca=new NyARPca2d_MatrixPCA_O2();
    this._xpos=new FloatVector(i_size.w+i_size.h);//最大辺長はthis._width+this._height
    this._ypos=new FloatVector(i_size.w+i_size.h);//最大辺長はthis._width+this._height
    return;
  }
  /**
   * 輪郭点集合からay+bx+c=0の直線式を計算します。
   * @param i_st
   * @param i_ed
   * @param i_xcoord
   * @param i_ycoord
   * @param i_cood_num
   * @param o_line
   * @return
   * @throws NyARException
   */
  ,coord2Line : function(i_st,i_ed,i_xcoord,i_ycoord,i_cood_num,o_line)
  {
    //頂点を取得
    var n,st,ed;
    var w1;
    //探索区間の決定
    if(i_ed>=i_st){
      //頂点[i]から頂点[i+1]までの輪郭が、1区間にあるとき
      w1 = (i_ed - i_st + 1) * 0.05 + 0.5;
      //探索区間の決定
      st = Math.floor(i_st+w1);
      ed = Math.floor(i_ed - w1);
    }else{
      //頂点[i]から頂点[i+1]までの輪郭が、2区間に分かれているとき
      w1 = ((i_ed+i_cood_num-i_st+1)%i_cood_num) * 0.05 + 0.5;
      //探索区間の決定
      st = (Math.floor(i_st+w1))%i_cood_num;
      ed = (Math.floor(i_ed+i_cood_num-w1))%i_cood_num;
    }
    //探索区間数を確認
    if(st<=ed){
      //探索区間は1区間
      n = ed - st + 1;
      this._dist_factor.observ2IdealBatch(i_xcoord, i_ycoord, st, n,this._xpos,this._ypos,0);
    }else{
      //探索区間は2区間
      n=ed+1+i_cood_num-st;
      this._dist_factor.observ2IdealBatch(i_xcoord, i_ycoord, st,i_cood_num-st,this._xpos,this._ypos,0);
      this._dist_factor.observ2IdealBatch(i_xcoord, i_ycoord, 0,ed+1,this._xpos,this._ypos,i_cood_num-st);
    }
    //要素数の確認
    if (n < 2) {
      // nが2以下でmatrix.PCAを計算することはできないので、エラー
      return false;
    }
    //主成分分析する。
    var evec=this.__getSquareLine_evec;
    var mean=this.__getSquareLine_mean;
    this._pca.pca(this._xpos,this._ypos,n,evec, this.__getSquareLine_ev,mean);
    o_line.dy = evec.m01;// line[i][0] = evec->m[1];
    o_line.dx = -evec.m00;// line[i][1] = -evec->m[0];
    o_line.c = -(o_line.dy * mean[0] + o_line.dx * mean[1]);// line[i][2] = -(line[i][0]*mean->v[0] + line[i][1]*mean->v[1]);
    return true;
  }
})

/**
 * get_vertex関数を切り離すためのクラス
 *
 */
NyARVertexCounter = ASKlass('NyARVertexCounter',
{
  vertex : new IntVector(10),// 6まで削れる
  number_of_vertex : 0,
  thresh : 0,
  x_coord : null,
  y_coord : null,
  getVertex : function(i_x_coord, i_y_coord,i_coord_len,st,ed,i_thresh)
  {
    this.number_of_vertex = 0;
    this.thresh = i_thresh;
    this.x_coord = i_x_coord;
    this.y_coord = i_y_coord;
    return this.get_vertex(st, ed,i_coord_len);
  }
  /**
  * static int get_vertex( int x_coord[], int y_coord[], int st, int ed,double thresh, int vertex[], int *vnum) 関数の代替関数
  *
  * @param x_coord
  * @param y_coord
  * @param st
  * @param ed
  * @param thresh
  * @return
  */
  ,get_vertex : function(st,ed,i_coord_len)
  {
    var i;
    var d;
    //メモ:座標値は65536を超えなければint32で扱って大丈夫なので変更。
    //dmaxは4乗なのでやるとしてもint64じゃないとマズイ
    var v1 = 0;
    var lx_coord = this.x_coord;
    var ly_coord = this.y_coord;
    var a = ly_coord[ed] - ly_coord[st];
    var b = lx_coord[st] - lx_coord[ed];
    var c = lx_coord[ed] * ly_coord[st] - ly_coord[ed] * lx_coord[st];
    var dmax = 0;
    if(st<ed){
      //stとedが1区間
      for (i = st + 1; i < ed; i++) {
        d = a * lx_coord[i] + b * ly_coord[i] + c;
        if (d * d > dmax) {
          dmax = d * d;
          v1 = i;
        }
      }
    }else{
      //stとedが2区間
      for (i = st + 1; i < i_coord_len; i++) {
        d = a * lx_coord[i] + b * ly_coord[i] + c;
        if (d * d > dmax) {
          dmax = d * d;
          v1 = i;
        }
      }
      for (i = 0; i < ed; i++) {
        d = a * lx_coord[i] + b * ly_coord[i] + c;
        if (d * d > dmax) {
          dmax = d * d;
          v1 = i;
        }
      }
    }
    if (dmax / (a * a + b * b) > this.thresh) {
      if (!this.get_vertex(st, v1,i_coord_len)) {
        return false;
      }
      if (this.number_of_vertex > 5) {
        return false;
      }
      this.vertex[this.number_of_vertex] = v1;// vertex[(*vnum)] = v1;
      this.number_of_vertex++;// (*vnum)++;
      if (!this.get_vertex(v1, ed,i_coord_len)) {
        return false;
      }
    }
    return true;
  }
})

NyARCoord2SquareVertexIndexes = ASKlass('NyARCoord2SquareVertexIndexes',
{
  VERTEX_FACTOR : 1.0,// 線検出のファクタ
  __getSquareVertex_wv1 : new NyARVertexCounter(),
  __getSquareVertex_wv2 : new NyARVertexCounter(),
  NyARCoord2SquareVertexIndexes : function()
  {
    return;
  }
  /**
   * 座標集合から、頂点候補になりそうな場所を４箇所探して、そのインデクス番号を返します。
   * @param i_x_coord
   * @param i_y_coord
   * @param i_coord_num
   * @param i_area
   * @param o_vertex
   * @return
   */
  ,getVertexIndexes : function(i_x_coord ,i_y_coord,i_coord_num, i_area,o_vertex)
  {
    var wv1 = this.__getSquareVertex_wv1;
    var wv2 = this.__getSquareVertex_wv2;
    var vertex1_index=this.getFarPoint(i_x_coord,i_y_coord,i_coord_num,0);
    var prev_vertex_index=(vertex1_index+i_coord_num)%i_coord_num;
    var v1=this.getFarPoint(i_x_coord,i_y_coord,i_coord_num,vertex1_index);
    var thresh = (i_area / 0.75) * 0.01 * this.VERTEX_FACTOR;
    o_vertex[0] = vertex1_index;
    if (!wv1.getVertex(i_x_coord, i_y_coord,i_coord_num, vertex1_index, v1, thresh)) {
      return false;
    }
    if (!wv2.getVertex(i_x_coord, i_y_coord,i_coord_num, v1,prev_vertex_index, thresh)) {
      return false;
    }
    var v2;
    if (wv1.number_of_vertex == 1 && wv2.number_of_vertex == 1) {
      o_vertex[1] = wv1.vertex[0];
      o_vertex[2] = v1;
      o_vertex[3] = wv2.vertex[0];
    } else if (wv1.number_of_vertex > 1 && wv2.number_of_vertex == 0) {
      //頂点位置を、起点から対角点の間の1/2にあると予想して、検索する。
      if(v1>=vertex1_index){
        v2 = (v1-vertex1_index)/2+vertex1_index;
      }else{
        v2 = ((v1+i_coord_num-vertex1_index)/2+vertex1_index)%i_coord_num;
      }
      if (!wv1.getVertex(i_x_coord, i_y_coord,i_coord_num, vertex1_index, v2, thresh)) {
        return false;
      }
      if (!wv2.getVertex(i_x_coord, i_y_coord,i_coord_num, v2, v1, thresh)) {
        return false;
      }
      if (wv1.number_of_vertex == 1 && wv2.number_of_vertex == 1) {
        o_vertex[1] = wv1.vertex[0];
        o_vertex[2] = wv2.vertex[0];
        o_vertex[3] = v1;
      } else {
        return false;
      }
    } else if (wv1.number_of_vertex == 0 && wv2.number_of_vertex > 1) {
      //v2 = (v1+ end_of_coord)/2;
      if(v1<=prev_vertex_index){
        v2 = (v1+prev_vertex_index)/2;
      }else{
        v2 = ((v1+i_coord_num+prev_vertex_index)/2)%i_coord_num;
      }
      if (!wv1.getVertex(i_x_coord, i_y_coord,i_coord_num, v1, v2, thresh)) {
        return false;
      }
      if (!wv2.getVertex(i_x_coord, i_y_coord,i_coord_num, v2, prev_vertex_index, thresh)) {
        return false;
      }
      if (wv1.number_of_vertex == 1 && wv2.number_of_vertex == 1) {
        o_vertex[1] = v1;
        o_vertex[2] = wv1.vertex[0];
        o_vertex[3] = wv2.vertex[0];
      } else {
        return false;
      }
    } else {
      return false;
    }
    return true;
  }
  /**
   * i_pointの輪郭座標から、最も遠方にある輪郭座標のインデクスを探します。
   * @param i_xcoord
   * @param i_ycoord
   * @param i_coord_num
   * @return
   */
  ,getFarPoint : function(i_coord_x,i_coord_y,i_coord_num,i_point)
  {
    //
    var sx = i_coord_x[i_point];
    var sy = i_coord_y[i_point];
    var d = 0;
    var w, x, y;
    var ret = 0;
    var i;
    for (i = i_point+1; i < i_coord_num; i++) {
      x = i_coord_x[i] - sx;
      y = i_coord_y[i] - sy;
      w = x * x + y * y;
      if (w > d) {
        d = w;
        ret = i;
      }
    }
    for (i= 0; i < i_point; i++) {
      x = i_coord_x[i] - sx;
      y = i_coord_y[i] - sy;
      w = x * x + y * y;
      if (w > d) {
        d = w;
        ret = i;
      }
    }
    return ret;
  }
})


/**
 * ARMarkerInfoに相当するクラス。 矩形情報を保持します。
 *
 */
NyARSquare = ASKlass('NyARSquare',
{
  line : NyARLinear.createArray(4),
  sqvertex : NyARDoublePoint2d.createArray(4),
  getCenter2d : function(o_out)
  {
    o_out.x=(this.sqvertex[0].x+this.sqvertex[1].x+this.sqvertex[2].x+this.sqvertex[3].x)/4;
    o_out.y=(this.sqvertex[0].y+this.sqvertex[1].y+this.sqvertex[2].y+this.sqvertex[3].y)/4;
    return;
  }
})
NyARSquareContourDetector = ASKlass('NyARSquareContourDetector',
{
  /**
   *
   * @param i_raster
   * @param i_callback
   * @throws NyARException
   */
  detectMarkerCB : function(i_raster, i_callback)
  {
    NyARException.trap("getRgbPixelReader not implemented.");
  }
})
NyARSquareContourDetector_IDetectMarkerCallback = ASKlass('NyARSquareContourDetector_IDetectMarkerCallback',
{
  onSquareDetect : function(i_sender,i_coordx,i_coordy,i_coor_num,i_vertex_index){}
})
RleLabelOverlapChecker = ASKlass('RleLabelOverlapChecker', NyARLabelOverlapChecker,
{
  RleLabelOverlapChecker : function(i_max_label)
  {
    NyARLabelOverlapChecker.initialize.call(this,i_max_label);
  }
  ,createArray : function(i_length)
  {
    return new Array(i_length);
  }
})
NyARSquareContourDetector_Rle = ASKlass('NyARSquareContourDetector_Rle', NyARSquareContourDetector,
{
  AR_AREA_MAX : 100000,// #define AR_AREA_MAX 100000
  AR_AREA_MIN : 70,// #define AR_AREA_MIN 70
  _width : 0,
  _height : 0,
  _labeling : null,
  _overlap_checker : new RleLabelOverlapChecker(32),
  _cpickup : new NyARContourPickup(),
  _stack : null,
  _coord2vertex : new NyARCoord2SquareVertexIndexes(),
  _max_coord : 0,
  _xcoord : null,
  _ycoord : null,
  /**
   * 最大i_squre_max個のマーカーを検出するクラスを作成する。
   *
   * @param i_param
   */
  NyARSquareContourDetector_Rle : function(i_size)
  {
    this._width = i_size.w;
    this._height = i_size.h;
    //ラベリングのサイズを指定したいときはsetAreaRangeを使ってね。
    this._labeling = new NyARLabeling_Rle(this._width,this._height);
    this._labeling.setAreaRange(this.AR_AREA_MAX, this.AR_AREA_MIN);
    this._stack=new NyARRleLabelFragmentInfoStack(i_size.w*i_size.h*2048/(320*240)+32);//検出可能な最大ラベル数
    // 輪郭の最大長は画面に映りうる最大の長方形サイズ。
    var number_of_coord= (this._width + this._height) * 2;
    // 輪郭バッファ
    this._max_coord = number_of_coord;
    this._xcoord = new IntVector(number_of_coord);
    this._ycoord = new IntVector(number_of_coord);
    return;
  },
  __detectMarker_mkvertex : new IntVector(4)
  ,detectMarkerCB : function(i_raster ,i_callback)
  {
    var flagment=this._stack;
    var overlap = this._overlap_checker;
    // ラベル数が0ならここまで
    var label_num=this._labeling.labeling_NyARBinRaster(i_raster, 0, i_raster.getHeight(), flagment);
    if (label_num < 1) {
      return;
    }
    //ラベルをソートしておく
    flagment.sortByArea();
    //ラベルリストを取得
    var labels=(flagment.getArray());
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
      //輪郭を取得
      var coord_num = _cpickup.getContour_NyARBinRaster(i_raster,label_pt.entry_x,label_pt.clip_t, coord_max, xcoord, ycoord);
      if (coord_num == coord_max) {
        // 輪郭が大きすぎる。
        continue;
      }
      //輪郭線をチェックして、矩形かどうかを判定。矩形ならばmkvertexに取得
      if (!this._coord2vertex.getVertexIndexes(xcoord, ycoord,coord_num,label_area, mkvertex)) {
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
NyARSquareStack = ASKlass('NyARSquareStack', NyARObjectStack,
{
  NyARSquareStack : function(i_length)
  {
    NyARObjectStack.initialize.call(this,i_length);
  }
  ,createArray : function(i_length)
  {
    var ret= new Array(i_length);
    for (var i =0; i < i_length; i++){
      ret[i] = new NyARSquare();
    }
    return (ret);
  }
})
