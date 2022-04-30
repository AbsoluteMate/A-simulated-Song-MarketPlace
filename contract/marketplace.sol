// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}



contract Marketplace {

    uint internal SongLength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Song {
        address payable owner;
        string name;
        string songlink;
        string description;
        uint votes;
        uint price;
        mapping(address => bool) upVote;
        bool exist;

    }
    mapping (uint => Song) internal Songs;


    function writeSong(
      string memory _name,
      string memory _songlink,
      string memory _description,
      uint _price
    ) public {
      require(msg.sender == 0xa71432288b5EA33C94c55b4A0cc4C99C17CC9863, "You don't have permissions to add new songs");
       Song storage info = Songs[SongLength];
          info.owner = payable(msg.sender);
          info.name = _name;
          info.songlink = _songlink;
          info.description = _description;
          info.price = _price;
          info.votes = 0;
          info.exist = true;
        SongLength++;
    }

    function editSong(uint _index,uint _price) public {
      require(msg.sender == Songs[_index].owner, "You don't have permissions to edit that song");
      Song storage edit = Songs[_index];
      edit.price = _price;
    }



    function readSong(uint _index) public view returns (
        address payable,
        string memory,
        string memory,
        string memory,
        uint,
        uint
    ) {
        return (
            Songs[_index].owner,
            Songs[_index].name,
            Songs[_index].songlink,
            Songs[_index].description,
            Songs[_index].votes,
            Songs[_index].price
        );
    }

    function buySong(uint _index) public payable  {
      require(
        IERC20Token(cUsdTokenAddress).transferFrom(
          msg.sender,
          Songs[_index].owner,
          Songs[_index].price
        ),
        "Transfer failed."
        );
        Songs[_index].owner = payable(msg.sender);
    }

    function vote(uint _index)public{
      require(Songs[_index].exist == true, "Item don't exist");
      require(Songs[_index].upVote[msg.sender] == false, "You can vote only once a song");
      Songs[_index].upVote[msg.sender] = true;
      Songs[_index].votes++;
     }


    function getSongLength() public view returns (uint) {
        return (SongLength);
    }
}
