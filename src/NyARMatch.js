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
 * ARColorPattのマッチング計算をするインタフェイスです。 基準Patに対して、計算済みのARCodeデータとの間で比較演算をします。
 * pattern_match関数を分解した３種類のパターン検出クラスを定義します。
 *
 */
INyARMatchPatt = ASKlass('INyARMatchPatt',
{
  setARCode : function(i_code){}
})
NyARMatchPatt_Color_WITHOUT_PCA = ASKlass('NyARMatchPatt_Color_WITHOUT_PCA', INyARMatchPatt,
{
  _code_patt : null,
  _optimize_for_mod : 0,
  _rgbpixels : 0,
  NyARMatchPatt_Color_WITHOUT_PCA : function()
  {
    switch(arguments.length){
    case 1:
      {  //,NyARMatchPatt_Color_WITHOUT_PCA : function(i_code_ref)
        var i_code_ref=arguments[0];
        var w=i_code_ref.getWidth();
        var h=i_code_ref.getHeight();
        //最適化定数の計算
        this._rgbpixels=w*h*3;
        this._optimize_for_mod=this._rgbpixels-(this._rgbpixels%16);
        this.setARCode(i_code_ref);
        return;
      }
      break;
    case 2:
      {  //,NyARMatchPatt_Color_WITHOUT_PCA : function(i_width,i_height)
        var i_width = toInt(arguments[0]), i_height = toInt(arguments[1]);
        //最適化定数の計算
        this._rgbpixels=i_height*i_width*3;
        this._optimize_for_mod=this._rgbpixels-(this._rgbpixels%16);
        return;
      }
      break;
    default:
      break;
    }
    throw new NyARException();
  }
  /**
   * 比較対象のARCodeをセットします。
   * @throws NyARException
   */
  ,setARCode : function(i_code_ref)
  {
    this._code_patt=i_code_ref;
    return;
  }
  /**
   * 現在セットされているARコードとi_pattを比較します。
   */
  ,evaluate : function(i_patt,o_result)
  {
    NyAS3Utils.assert(this._code_patt!=null);
    //
    var linput = i_patt.refData();
    var sum;
    var max = Number.MIN_VALUE;
    var res = NyARMatchPattResult.DIRECTION_UNKNOWN;
    var for_mod=this._optimize_for_mod;
    for (var j = 0; j < 4; j++) {
      //合計値初期化
      sum=0;
      var code_patt=this._code_patt.getColorData(j);
      var pat_j = code_patt.refData();
      //<全画素について、比較(FORの1/16展開)>
      var i;
      for(i=this._rgbpixels-1;i>=for_mod;i--){
        sum += linput[i] * pat_j[i];
      }
      for (;i>=0;) {
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
        sum += linput[i] * pat_j[i];i--;
      }
      //<全画素について、比較(FORの1/16展開)/>
      var sum2 = sum / code_patt.getPow();// sum2 = sum / patpow[k][j]/ datapow;
      if (sum2 > max) {
        max = sum2;
        res = j;
      }
    }
    o_result.direction = res;
    o_result.confidence= max/i_patt.getPow();
    return true;
  }
})
