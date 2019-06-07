/**
 * highlight.js Solidity syntax highlighting definition
 *
 * @see https://github.com/isagalaev/highlight.js
 *
 * :TODO:
 * - assembly block keywords
 *
 * @package: highlightjs-solidity
 * @author:  Sam Pospischil <sam@changegiving.com>
 * @since:   2016-07-01
 */

var module = module ? module : {};     // shim for browser use

function hljsDefineSolidity(hljs) {

    //first: let's set up all parameterized types (bytes, int, uint, fixed, ufixed)
    //NOTE: I'm *not* including the unparameterized versions here, those are included
    //manually
    var byteSizes = [];
    for(var i = 0; i < 32; i++) {
        byteSizes[i] = i+1;
    }
    var numSizes = byteSizes.map(function(bytes) { return bytes * 8 } );
    for(i = 0; i <= 80; i++) {
        precisions[i] = i;
    }

    var bytesTypes = byteSizes.map(function(size) { return 'bytes' + size });
    var bytesTypesString = bytesTypes.join(' ') + ' ';

    var uintTypes = numSizes.map(function(size) { return 'uint' + size });
    var uintTypesString = uintTypes.join(' ') + ' ';

    var intTypes = numSizes.map(function(size) { return 'int' + size });
    var intTypesString = intTypes.join(' ') + ' ';

    var sizePrecisionPairs = [].concat.apply([],
        numSizes.map(function(size) {
            return precisions.map(function(precision) {
                return size + 'x' + precision;
            })
        })
    );

    var fixedTypes = sizePrecisionPairs.map(function(pair) { return 'fixed' + pair });
    var fixedTypesString = fixedTypes.join(' ') + ' ';

    var ufixedTypes = sizePrecisionPairs.map(function(pair) { return 'ufixed' + pair });
    var ufixedTypesString = ufixedTypes.join(' ') + ' ';

    var SOL_KEYWORDS = {
        keyword:
            'var bool string ' +
            'int uint ' + intTypesString + uintTypesString +
            'byte bytes ' + bytesTypesString +
            'fixed ufixed ' + fixedTypesString + ufixedTypesString +
            'enum struct mapping address ' +

            'new delete ' +
            'if else for while continue break return throw emit ' +
            //NOTE: doesn't always act as a keyword, but I think it's fine to include
            '_ ' +

            'function modifier event constructor ' +
            'constant anonymous indexed ' +
            'storage memory calldata ' +
            'external public internal payable pure view private returns ' +

            'import using pragma ' +
            'contract interface library ' +
            'assembly',
        literal:
            'true false ' +
            'wei szabo finney ether ' +
            'seconds minutes hours days weeks years',
        built_in:
            'self ' +   // :NOTE: not a real keyword, but a convention used in storage manipulation libraries
            'this super selfdestruct suicide ' +
            'now ' +
            'msg block tx abi ' +
            'type '
            'blockhash gasleft ' +
            'assert revert require ' +
            'sha3 sha256 keccak256 ripemd160 ecrecover addmod mulmod ' +
            // :NOTE: not really toplevel, but advantageous to have highlighted as if reserved to
            //        avoid newcomers making mistakes due to accidental name collisions.
            'send transfer call callcode delegatecall staticcall ',
    };

    var SOL_ASSEMBLY_KEYWORDS = {
        keyword:
            'assembly ' +
            'let ' +
            'if switch case default for',
        built_in:
            //NOTE that push1 through push32, as well as jumpdest, are not included
            'stop ' +
            'add sub mul div sdiv mod smod exp not lt gt slt sgt eq iszero ' +
            'and or xor byte shl shr sar ' +
            'addmod mulmod signextend keccak256 ' +
            'jump jumpi pc pop ' +
            'dup1 dup2 dup3 dup4 dup5 dup6 dup7 dup8 dup9 dup10 dup11 dup12 dup13 dup14 dup15 dup16 ' +
            'swap1 swap2 swap3 swap4 swap5 swap6 swap7 swap8 swap9 swap10 swap11 swap12 swap13 swap14 swap15 swap16 ' +
            'mload mstore mstore8 sload sstore msize
            'gas address balance caller callvalue ' +
            'calldataload calldatasize calldatacopy codesize codecopy extcodesize extcodecopy returndatasize returndatacopy extcodehash ' +
            'create create2 call callcode delegatecall staticcall ' +
            'return revert selfdestruct invalid ' +
            'log0 log1 log2 log3 log4 ' +
            'origin gasprice blockhash coinbase timestamp number difficulty gaslimit'
    };

    //covers the special slot/offset notation in assembly
    var SOL_ASSEMBLY_MEMBERS = {
        begin: /_/,
        end: /[^A-Za-z0-9$_]/,
        excludeBegin: true,
        excludeEnd: true,
        keywords: {
            built_in: 'slot offset'
        },
        relevance: 2,
    };

    //like a C number, except:
    //1. no octal literals (leading zeroes disallowed)
    //2. underscores (1 apiece) are allowed between consecutive digits
    //(including hex digits)
    var SOL_NUMBER_RE = /-?(\b0[xX]([a-fA-F0-9]_?)*[a-fA-F0-9]|(\b[1-9](_?\d)*(\.((\d_?)*\d)?)?|\.\d(_?\d)*)([eE][-+]?\d(_?\d)*)?)/;

    var SOL_NUMBER = {
        className: 'number',
        begin: SOL_NUMBER_RE,
        relevance: 0,
    };

    var SOL_FUNC_PARAMS = {
        className: 'params',
        begin: /\(/, end: /\)/,
        excludeBegin: true,
        excludeEnd: true,
        keywords: SOL_KEYWORDS,
        contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            SOL_NUMBER,
        ],
    };

    var HEX_APOS_STRING_MODE = {
      className: 'string',
      begin: /hex'[0-9a-fA-F]'/,
    };
    var HEX_QUOTE_STRING_MODE = {
      className: 'string',
      begin: /hex"[0-9a-fA-F]"/,
    };

    var SOL_RESERVED_MEMBERS = {
        begin: /\.\s*/,  // match any property access up to start of prop
        end: /[^A-Za-z0-9$_\.]/,
        excludeBegin: true,
        excludeEnd: true,
        keywords: {
            built_in: 'gas value send transfer call callcode delegatecall staticcall balance length push pop name creationCode runtimeCode',
        },
        relevance: 2,
    };

    function makeBuiltinProps(obj, props) {
        return {
            begin: obj + '\\.\\s*',
            end: /[^A-Za-z0-9$_\.]/,
            excludeBegin: false,
            excludeEnd: true,
            keywords: {
                built_in: obj + ' ' + props,
            },
            contains: [
                SOL_RESERVED_MEMBERS,
            ],
            relevance: 10,
        };
    }

    return {
        aliases: ['sol'],
        keywords: SOL_KEYWORDS,
        contains: [
            // basic literal definitions
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            HEX_APOS_STRING_MODE,
            HEX_QUOTE_SRING_MODE,
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            SOL_NUMBER,
            { // functions
                className: 'function',
                beginKeywords: 'function modifier event', end: /[{;]/, excludeEnd: true,
                contains: [
                    hljs.inherit(hljs.TITLE_MODE, {
                        begin: /[A-Za-z$_][0-9A-Za-z$_]*/,
                        keywords: SOL_KEYWORDS,
                    }),
                    SOL_FUNC_PARAMS,
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE,
                ],
                illegal: /\[|%/,
            },
            // built-in members
            makeBuiltinProps('msg', 'gas value data sender sig'),
            makeBuiltinProps('block', 'blockhash coinbase difficulty gaslimit number timestamp '),
            makeBuiltinProps('tx', 'gasprice origin'),
            makeBuiltinProps('abi', 'decode encode encodePacked encodeWithSelector encodeWithSignature'),
            SOL_RESERVED_MEMBERS,
            { // contracts & libraries & interfaces
                className: 'class',
                beginKeywords: 'contract interface library', end: /[{]/, excludeEnd: true,
                illegal: /[:"\[\]]/,
                contains: [
                    { beginKeywords: 'is' },
                    hljs.UNDERSCORE_TITLE_MODE,
                    SOL_FUNC_PARAMS,
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE,
                ]
            },
            { // imports
                beginKeywords: 'import', end: ';|$',
                keywords: 'import * from as',
                contains: [
                    hljs.APOS_STRING_MODE,
                    hljs.QUOTE_STRING_MODE,
                    HEX_APOS_STRING_MODE,
                    HEX_QUOTE_SRING_MODE,
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE,
                ]
            },
            { // using
                beginKeywords: 'import', end: ';|$',
                keywords: 'using * for',
                contains: [
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE,
                ]
            },
            { // pragmas
                beginKeywords: 'pragma', end: ';|$',
                keywords: {
                    keyword: 'pragma solidity experimental',
                    built_in: 'ABIEncoderV2 SMTChecker'
                },
                contains: [
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE,
                ]
            },
            { //assembly block
                begin: /assembly\s*{/, end: '}',
                keywords: SOL_ASSEMBLY_KEYWORDS,
                contains: [
                    hljs.APOS_STRING_MODE,
                    hljs.QUOTE_STRING_MODE,
                    HEX_APOS_STRING_MODE,
                    HEX_QUOTE_SRING_MODE,
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE,
                    SOL_NUMBER,
                    SOL_ASSEMBLY_MEMBERS,
                    { //block within assembly
                        begin: '{', end: '}',
                        keywords: SOL_ASSEMBLY_KEYWORDS,
                        contains: [
                            hljs.APOS_STRING_MODE,
                            hljs.QUOTE_STRING_MODE,
                            HEX_APOS_STRING_MODE,
                            HEX_QUOTE_SRING_MODE,
                            hljs.C_LINE_COMMENT_MODE,
                            hljs.C_BLOCK_COMMENT_MODE,
                            SOL_NUMBER,
                            SOL_ASSEMBLY_MEMBERS,
                            'self'
                        ]
                    }
                ]
            }
        ],
        illegal: /#/,
    };
}

module.exports = function(hljs) {
    hljs.registerLanguage('solidity', hljsDefineSolidity);
};

module.exports.definer = hljsDefineSolidity;
