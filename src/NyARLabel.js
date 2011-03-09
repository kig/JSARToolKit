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


/**
 * ...
 * @author
 */
NyARLabelInfo = ASKlass('NyARLabelInfo',
{
  area : 0,
  clip_r : 0,
  clip_l : 0,
  clip_b : 0,
  clip_t : 0,
  pos_x : 0,
  pos_y : 0,
  NyARLabelInfo : function()
  {
  }
})


//  import jp.nyatla.nyartoolkit.as3.core.types.stack.*;
NyARLabelInfoStack = ASKlass('NyARLabelInfoStack', // NyARObjectStack,
{
  _items : null,
  _length : 0,
  NyARLabelInfoStack : function(i_length)
  {
    //領域確保
    this._items = this.createArray(i_length);
    //使用中個数をリセット
    this._length = 0;
    return;
  }
  ,createArray : function(i_length)
  {
    var ret= new Array(i_length);
    for (var i =0; i < i_length; i++){
      ret[i] = new NyARLabelInfo();
    }
    return (ret);
  }
  /**
   * エリアの大きい順にラベルをソートします。
   */
  ,sortByArea : function()
  {
    var len=this._length;
    if(len<1){
      return;
    }
    var h = Math.floor(len * 13/10);
    var item=this._items;
    for(;;){
      var swaps = 0;
      for (var i = 0; i + h < len; i++) {
        if (item[i + h].area > item[i].area) {
          var temp = item[i + h];
          item[i + h] = item[i];
          item[i] = temp;
          swaps++;
        }
      }
      if (h == 1) {
        if (swaps == 0){
          break;
        }
      }else{
        h=Math.floor(h*10/13);
      }
    }
  }
  /**
   * 新しい領域を予約します。
   * @return
   * 失敗するとnull
   * @throws NyARException
   */
  ,prePush : function()
  {
    // 必要に応じてアロケート
    if (this._length >= this._items.length){
      return null;
    }
    // 使用領域を+1して、予約した領域を返す。
    var ret = this._items[this._length];
    this._length++;
    return ret;
  }
  /**
   * スタックを初期化します。
   * @param i_reserv_length
   * 使用済みにするサイズ
   * @return
   */
  ,init : function(i_reserv_length)
  {
    // 必要に応じてアロケート
    if (i_reserv_length >= this._items.length){
      throw new NyARException();
    }
    this._length=i_reserv_length;
  }
  /**
   * 見かけ上の要素数を1減らして、そのオブジェクトを返します。
   * 返却したオブジェクトの内容は、次回のpushまで有効です。
   * @return
   */
  ,pop : function()
  {
    NyAS3Utils.assert(this._length>=1);
    this._length--;
    return this._items[this._length];
  }
  /**
   * 見かけ上の要素数をi_count個減らします。
   * @param i_count
   * @return
   */
  ,pops : function(i_count)
  {
    NyAS3Utils.assert(this._length>=i_count);
    this._length-=i_count;
    return;
  }
  /**
   * 配列を返します。
   *
   * @return
   */
  ,getArray : function()
  {
    return this._items;
  }
  ,getItem : function(i_index)
  {
    return this._items[i_index];
  }
  /**
   * 配列の見かけ上の要素数を返却します。
   * @return
   */
  ,getLength : function()
  {
    return this._length;
  }
  /**
   * 見かけ上の要素数をリセットします。
   */
  ,clear : function()
  {
    this._length = 0;
  }
})
NyARLabelOverlapChecker = ASKlass('NyARLabelOverlapChecker',
{
  _labels : null,
  _length : 0,
  /*
  */
  NyARLabelOverlapChecker : function(i_max_label)
  {
    this._labels = this.createArray(i_max_label);
  }
  ,createArray : function(i_length)
  {
    return new Array(i_length);
  }
  /**
   * チェック対象のラベルを追加する。
   *
   * @param i_label_ref
   */
  ,push : function(i_label_ref)
  {
    this._labels[this._length] = i_label_ref;
    this._length++;
  }
  /**
   * 現在リストにあるラベルと重なっているかを返す。
   *
   * @param i_label
   * @return 何れかのラベルの内側にあるならばfalse,独立したラベルである可能性が高ければtrueです．
   */
  ,check : function(i_label)
  {
    // 重なり処理かな？
    var label_pt  = this._labels;
    var px1 = toInt(i_label.pos_x);
    var py1 = toInt(i_label.pos_y);
    for (var i = this._length - 1; i >= 0; i--) {
      var px2 = toInt(label_pt[i].pos_x);
      var py2 = toInt(label_pt[i].pos_y);
      var d = (px1 - px2) * (px1 - px2) + (py1 - py2) * (py1 - py2);
      if (d < label_pt[i].area / 4) {
        // 対象外
        return false;
      }
    }
    // 対象
    return true;
  }
  /**
   * 最大i_max_label個のラベルを蓄積できるようにオブジェクトをリセットする
   *
   * @param i_max_label
   */
  ,setMaxLabels : function(i_max_label)
  {
    if (i_max_label > this._labels.length) {
      this._labels = this.createArray(i_max_label);
    }
    this._length = 0;
  }
})




// RleImageをラベリングする。
NyARLabeling_Rle = ASKlass('NyARLabeling_Rle',
{
  AR_AREA_MAX : 100000,// #define AR_AREA_MAX 100000
  AR_AREA_MIN : 70,// #define AR_AREA_MIN 70
  _rlestack : null,
  _rle1 : null,
  _rle2 : null,
  _max_area : 0,
  _min_area : 0,
  NyARLabeling_Rle : function(i_width,i_height)
  {
    this._rlestack=new RleInfoStack(i_width*i_height*2048/(320*240)+32);
    this._rle1 = RleElement.createArray(i_width/2+1);
    this._rle2 = RleElement.createArray(i_width/2+1);
    this.setAreaRange(this.AR_AREA_MAX,this.AR_AREA_MIN);
    return;
  }
  /**
   * 対象サイズ
   * @param i_max
   * @param i_min
   */
  ,setAreaRange : function(i_max,i_min)
  {
    this._max_area=i_max;
    this._min_area=i_min;
    return;
  }
  /**
   * i_bin_bufのgsイメージをRLE圧縮する。
   * @param i_bin_buf
   * @param i_st
   * @param i_len
   * @param i_out
   * @param i_th
   * BINラスタのときは0,GSラスタの時は閾値を指定する。
   * この関数は、閾値を暗点と認識します。
   * 暗点<=th<明点
   * @return
   */
  ,toRLE : function(i_bin_buf,i_st,i_len,i_out,i_th)
  {
    var current = 0;
    var lidx=0,ridx=1,fidx=2,off=3;
    var r = -1;
    // 行確定開始
    var x = i_st;
    var right_edge = i_st + i_len - 1;
    while (x < right_edge) {
      // 暗点(0)スキャン
      if (i_bin_buf[x] != 0xffffffff) {
        x++;//明点
        continue;
      }
      // 暗点発見→暗点長を調べる
      r = (x - i_st);
      i_out[current+lidx] = r;
      r++;// 暗点+1
      x++;
      while (x < right_edge) {
        if (i_bin_buf[x] != 0xffffffff) {
          // 明点(1)→暗点(0)配列終了>登録
          i_out[current+ridx] = r;
          current+=off;
          x++;// 次点の確認。
          r = -1;// 右端の位置を0に。
          break;
        } else {
          // 暗点(0)長追加
          r++;
          x++;
        }
      }
    }
    // 最後の1点だけ判定方法が少し違うの。
    if (i_bin_buf[x] != 0xffffffff) {
      // 明点→rカウント中なら暗点配列終了>登録
      if (r >= 0) {
        i_out[current+ridx] = r;
        current+=off;
      }
    } else {
      // 暗点→カウント中でなければl1で追加
      if (r >= 0) {
        i_out[current+ridx] = (r + 1);
      } else {
        // 最後の1点の場合
        i_out[current+lidx] = (i_len - 1);
        i_out[current+ridx] = (i_len);
      }
      current+=off;
    }
    // 行確定
    return current/off;
  }
  ,addFragment : function(i_rel_img,i_img_idx,i_nof,i_row_index,o_stack)
  {
    var lidx=0,ridx=1,fidx=2,off=3;
    var l = i_rel_img[i_img_idx+lidx];
    var r = i_rel_img[i_img_idx+ridx];
    var len=r - l;
    i_rel_img[i_img_idx+fidx] = i_nof;// REL毎の固有ID
    var v = o_stack.prePush();
    v.entry_x = l;
    v.area =len;
    v.clip_l=l;
    v.clip_r=r-1;
    v.clip_t=i_row_index;
    v.clip_b=i_row_index;
    v.pos_x=(len*(2*l+(len-1)))/2;
    v.pos_y=i_row_index*len;
    return;
  }
  //所望のラスタからBIN-RLEに変換しながらの低速系も準備しようかな
  /**
   * 単一閾値を使ってGSラスタをBINラスタに変換しながらラベリングします。
   * @param i_gs_raster
   * @param i_top
   * @param i_bottom
   * @param o_stack
   * @return
   * @throws NyARException
   */
  ,labeling_NyARBinRaster : function(i_bin_raster,i_top,i_bottom,o_stack)
  {
    NyAS3Utils.assert(i_bin_raster.isEqualBufferType(NyARBufferType.INT1D_BIN_8));
    return this.imple_labeling(i_bin_raster,0,i_top,i_bottom,o_stack);
  }
  /**
   * BINラスタをラベリングします。
   * @param i_gs_raster
   * @param i_th
   * 画像を２値化するための閾値。暗点&lt;=th&lt;明点となります。
   * @param i_top
   * @param i_bottom
   * @param o_stack
   * @return
   * @throws NyARException
   */
  ,labeling_NyARGrayscaleRaster : function(i_gs_raster,i_th,i_top,i_bottom,o_stack)
  {
    NyAS3Utils.assert(i_gs_raster.isEqualBufferType(NyARBufferType.INT1D_GRAY_8));
    return this.imple_labeling(i_gs_raster,i_th,i_top,i_bottom,o_stack);
  }
  ,labeling : function(i_bin_raster,o_stack)
  {
    return this.imple_labeling(i_bin_raster,0,0,i_bin_raster.getHeight(),o_stack);
  }
  ,imple_labeling : function(i_raster,i_th,i_top,i_bottom,o_stack)
  {
    // リセット処理
    var rlestack=this._rlestack;
    rlestack.clear();
    //
    var rle_prev = this._rle1;
    var rle_current = this._rle2;
    var len_prev = 0;
    var len_current = 0;
    var width = i_raster.getWidth();
    var in_buf = (i_raster.getBuffer().data);
    var id_max = 0;
    var label_count=0;
    var lidx=0,ridx=1,fidx=2,off=3;
    // 初段登録
    len_prev = this.toRLE(in_buf, i_top, width, rle_prev, i_th);
    var i;
    for (i = 0; i < len_prev; i++) {
      // フラグメントID=フラグメント初期値、POS=Y値、RELインデクス=行
      this.addFragment(rle_prev, i*off, id_max, i_top,rlestack);
      id_max++;
      // nofの最大値チェック
      label_count++;
    }
    var f_array = (rlestack.getArray());
    // 次段結合
    for (var y = i_top + 1; y < i_bottom; y++) {
      // カレント行の読込
      len_current = this.toRLE(in_buf, y * width, width, rle_current,i_th);
      var index_prev = 0;
      SCAN_CUR: for (i = 0; i < len_current; i++) {
        // index_prev,len_prevの位置を調整する
        var id = -1;
        // チェックすべきprevがあれば確認
        SCAN_PREV: while (index_prev < len_prev) {
          if (rle_current[i*off+lidx] - rle_prev[index_prev*off+ridx] > 0) {// 0なら8方位ラベリング
            // prevがcurの左方にある→次のフラグメントを探索
            index_prev++;
            continue;
          } else if (rle_prev[index_prev*off+lidx] - rle_current[i*off+ridx] > 0) {// 0なら8方位ラベリングになる
            // prevがcur右方にある→独立フラグメント
            this.addFragment(rle_current, i*off, id_max, y,rlestack);
            id_max++;
            label_count++;
            // 次のindexをしらべる
            continue SCAN_CUR;
          }
          id=rle_prev[index_prev*off+fidx];//ルートフラグメントid
          var id_ptr = f_array[id];
          //結合対象(初回)->prevのIDをコピーして、ルートフラグメントの情報を更新
          rle_current[i*off+fidx] = id;//フラグメントIDを保存
          //
          var l= rle_current[i*off+lidx];
          var r= rle_current[i*off+ridx];
          var len=r-l;
          //結合先フラグメントの情報を更新する。
          id_ptr.area += len;
          //tとentry_xは、結合先のを使うので更新しない。
          id_ptr.clip_l=l<id_ptr.clip_l?l:id_ptr.clip_l;
          id_ptr.clip_r=r>id_ptr.clip_r?r-1:id_ptr.clip_r;
          id_ptr.clip_b=y;
          id_ptr.pos_x+=(len*(2*l+(len-1)))/2;
          id_ptr.pos_y+=y*len;
          //多重結合の確認（２個目以降）
          index_prev++;
          while (index_prev < len_prev) {
            if (rle_current[i*off+lidx] - rle_prev[index_prev*off+ridx] > 0) {// 0なら8方位ラベリング
              // prevがcurの左方にある→prevはcurに連結していない。
              break SCAN_PREV;
            } else if (rle_prev[index_prev*off+lidx] - rle_current[i*off+ridx] > 0) {// 0なら8方位ラベリングになる
              // prevがcurの右方にある→prevはcurに連結していない。
              index_prev--;
              continue SCAN_CUR;
            }
            // prevとcurは連結している→ルートフラグメントの統合
            //結合するルートフラグメントを取得
            var prev_id =rle_prev[index_prev*off+fidx];
            var prev_ptr = f_array[prev_id];
            if (id != prev_id){
              label_count--;
              //prevとcurrentのフラグメントidを書き換える。
              var i2;
              for(i2=index_prev;i2<len_prev;i2++){
                //prevは現在のidから最後まで
                if(rle_prev[i2*off+fidx]==prev_id){
                  rle_prev[i2*off+fidx]=id;
                }
              }
              for(i2=0;i2<i;i2++){
                //currentは0から現在-1まで
                if(rle_current[i2*off+fidx]==prev_id){
                  rle_current[i2*off+fidx]=id;
                }
              }
              //現在のルートフラグメントに情報を集約
              id_ptr.area +=prev_ptr.area;
              id_ptr.pos_x+=prev_ptr.pos_x;
              id_ptr.pos_y+=prev_ptr.pos_y;
              //tとentry_xの決定
              if (id_ptr.clip_t > prev_ptr.clip_t) {
                // 現在の方が下にある。
                id_ptr.clip_t = prev_ptr.clip_t;
                id_ptr.entry_x = prev_ptr.entry_x;
              }else if (id_ptr.clip_t < prev_ptr.clip_t) {
                // 現在の方が上にある。prevにフィードバック
              } else {
                // 水平方向で小さい方がエントリポイント。
                if (id_ptr.entry_x > prev_ptr.entry_x) {
                  id_ptr.entry_x = prev_ptr.entry_x;
                }else{
                }
              }
              //lの決定
              if (id_ptr.clip_l > prev_ptr.clip_l) {
                id_ptr.clip_l=prev_ptr.clip_l;
              }else{
              }
              //rの決定
              if (id_ptr.clip_r < prev_ptr.clip_r) {
                id_ptr.clip_r=prev_ptr.clip_r;
              }else{
              }
              //bの決定
              //結合済のルートフラグメントを無効化する。
              prev_ptr.area=0;
            }
            index_prev++;
          }
          index_prev--;
          break;
        }
        // curにidが割り当てられたかを確認
        // 右端独立フラグメントを追加
        if (id < 0){
          this.addFragment(rle_current, i*off, id_max, y,rlestack);
          id_max++;
          label_count++;
        }
      }
      // prevとrelの交換
      var tmp = rle_prev;
      rle_prev = rle_current;
      len_prev = len_current;
      rle_current = tmp;
    }
    //対象のラベルだけ転写
    o_stack.init(label_count);
    var o_dest_array=(o_stack.getArray());
    var max=this._max_area;
    var min=this._min_area;
    var active_labels=0;
    for(i=id_max-1;i>=0;i--){
      var area=f_array[i].area;
      if(area<min || area>max){//対象外のエリア0のもminではじく
        continue;
      }
      //
      var src_info=f_array[i];
      var dest_info=o_dest_array[active_labels];
      dest_info.area=area;
      dest_info.clip_b=src_info.clip_b;
      dest_info.clip_r=src_info.clip_r;
      dest_info.clip_t=src_info.clip_t;
      dest_info.clip_l=src_info.clip_l;
      dest_info.entry_x=src_info.entry_x;
      dest_info.pos_x=src_info.pos_x/src_info.area;
      dest_info.pos_y=src_info.pos_y/src_info.area;
      active_labels++;
    }
    //ラベル数を再設定
    o_stack.pops(label_count-active_labels);
    //ラベル数を返却
    return active_labels;
  }
})
RleInfo = ASKlass('RleInfo',
{
//継承メンバ
entry_x : 0, // フラグメントラベルの位置
area : 0,
clip_r : 0,
clip_l : 0,
clip_b : 0,
clip_t : 0,
pos_x : 0,
pos_y : 0
})

RleInfoStack = ASKlass('RleInfoStack', NyARObjectStack,
{
  RleInfoStack : function(i_length)
  {
    NyARObjectStack.initialize.call(this,i_length);
    return;
  }
  ,createArray : function(i_length)
  {
    var ret= new Array(toInt(i_length));
    for (var i =0; i < i_length; i++){
      ret[i] = new RleInfo();
    }
    return ret;
  }
})
RleElement = ASKlass('RleElement',
{
  l : 0,
  r : 0,
  fid : 0,
  createArray : function(i_length)
  {
    return new IntVector(toInt(i_length)*3);
    var ret = new Array(toInt(i_length));
    for (var i = 0; i < i_length; i++) {
      ret[i] = new RleElement();
    }
    return ret;
  }
})
NyARRleLabelFragmentInfo = ASKlass('NyARRleLabelFragmentInfo', NyARLabelInfo,
{
  //継承メンバ
  //int area; // フラグメントラベルの領域数
  entry_x : 0 // フラグメントラベルの位置
})
NyARRleLabelFragmentInfoStack = ASKlass('NyARRleLabelFragmentInfoStack',  NyARLabelInfoStack,
{
  NyARRleLabelFragmentInfoStack : function(i_length)
  {
    NyARLabelInfoStack.initialize.call(this,i_length);
    return;
  }
  ,createArray : function(i_length)
  {
    var ret= new Array(toInt(i_length));
    for (var i =0; i < i_length; i++){
      ret[i] = new NyARRleLabelFragmentInfo();
    }
    return (ret);
  }
})
