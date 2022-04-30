import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import marketplaceAbi from "../contract/marketplace.abi.json"
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const MPContractAddress = "0x575816df768b4a23310379337ee6071187bfc0bb"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

let kit
let contract
let products = []

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(MPContractAddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}

const getProducts = async function() {
  const _productsLength = await contract.methods.getSongLength().call()
  const _products = []
  for (let i = 0; i < _productsLength; i++) {
    let _product = new Promise(async (resolve, reject) => {
      let p = await contract.methods.readSong(i).call()
      resolve({
        index: i,
        owner: p[0],
        name: p[1],
        songlink: p[2],
        description: p[3],
        votes: p[4],
        price: new BigNumber(p[5])
      })
    })
    _products.push(_product)
  }
  products = await Promise.all(_products)
  renderProducts()
}

function renderProducts() {
  document.getElementById("marketplace").innerHTML = ""
  products.forEach((_product) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = productTemplate(_product)
    document.getElementById("marketplace").appendChild(newDiv)
  })
}

function productTemplate(_product) {
  var parts = _product.songlink.split("/");
  var song_link = parts[parts.length - 1].split('?')[0];
  if(_product.owner != kit.defaultAccount){
    return `
      <div class="card mb-4">
      <iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${song_link}?utm_source=generator" width="100%" height="380" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
        <div class="card-body text-left p-4 position-relative">
          <div class="translate-middle-y position-absolute top-0">
          ${identiconTemplate(_product.owner)}
          </div>
          <h2 class="card-title fs-4 fw-bold mt-2">${_product.name} <a style="font-size:20px;float:right;font-style:italic;color:#ff0101;text-decoration:none;"><img class="vote_button" id=${_product.index} style="height:25px;cursor:pointer;" src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Heart_coraz%C3%B3n.svg/2048px-Heart_coraz%C3%B3n.svg.png" class="img-responsive"></img> ${_product.votes} </a></h2>
          <p class="card-text mb-2" style="min-height: 82px">
            ${_product.description}
          </p>
          <div class="d-grid gap-2">
            <a class="btn btn-dark rounded-pill buyBtn fs-6 p-3" id=${_product.index} style="font-weight:bold">
              Buy for ${_product.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
            </a>
          </div>
        </div>
      </div>
    `
  }else{
    return `
      <div class="card mb-4">
      <iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${song_link}?utm_source=generator" width="100%" height="380" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
        <div class="card-body text-left p-4 position-relative">
          <div class="translate-middle-y position-absolute top-0">
          ${identiconTemplate(_product.owner)}
          </div>
            <h2 class="card-title fs-4 fw-bold mt-2">${_product.name} <a style="font-size:20px;float:right;font-style:italic;color:#ff0101;text-decoration:none;"><img class="vote_button" id=${_product.index} style="height:25px;cursor:pointer;" src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Heart_coraz%C3%B3n.svg/2048px-Heart_coraz%C3%B3n.svg.png" class="img-responsive"></img> ${_product.votes} </a></h2>
          <p class="card-text mb-2" style="min-height: 82px">
            ${_product.description}
          </p>

          <div class="d-grid gap-2">
          <a class="btn btn-dark rounded-pill fs-6 p-3 editsongpricem" data-bs-toggle="modal" data-bs-target="#editModal" s_id="${_product.index}" s_name="${_product.name}" style="color: #56ff00;font-weight: bold;">
            Edit price (Current: ${_product.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD)
          </a>
          </div>
        </div>
      </div>
    `
  }

}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await getProducts()
  notificationOff()
  if(kit.defaultAccount != "0xa71432288b5EA33C94c55b4A0cc4C99C17CC9863"){
    document.getElementById('addNewSong').style.display = 'none';
  }
});

document
  .querySelector("#newProductBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newProductName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newProductDescription").value,
      new BigNumber(document.getElementById("newPrice").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString()
    ]
    notification(`⌛ Adding "${params[0]}"...`)
    try {
      const result = await contract.methods
        .writeSong(...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getProducts()
  })



  document.querySelector("#marketplace").addEventListener("click", async (e) => {
    if (e.target.className.includes("editsongpricem")) {
      var song_id = e.target.getAttribute('s_id')
      var song_name = e.target.getAttribute('s_name')
      document.getElementById("edit_modal_id").value = song_id
      document.getElementById("edit_modal_name").value = song_name
    }
  });


  document
    .querySelector("#editSongBtn")
    .addEventListener("click", async (e) => {
      const params = [
        document.getElementById("edit_modal_id").value,
        new BigNumber(document.getElementById("edit_modal_price").value)
        .shiftedBy(ERC20_DECIMALS)
        .toString()
      ]
      notification(`⌛ Changing Song price...`)
      try {
        const result = await contract.methods
          .editSong(...params)
          .send({ from: kit.defaultAccount })
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
      notification(`🎉 You successfully changed the Song price.`)
      getProducts()
    })

document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("vote_button")) {
    const id_song = e.target.id
    notification(`⌛ Liking song_id "${id_song}"...`)
    try {
      const result = await contract.methods
        .vote(id_song)
        .send({ from: kit.defaultAccount })
      notification(`🎉 You successfully liked "${id_song}".`)
      getProducts()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }


}
})


document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("buyBtn")) {
    const index = e.target.id
    notification("⌛ Waiting for payment approval...")
    try {
      await approve(products[index].price)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`⌛ Awaiting payment for "${products[index].name}"...`)
    try {
      const result = await contract.methods
        .buySong(index)
        .send({ from: kit.defaultAccount })
      notification(`🎉 You successfully bought "${products[index].name}".`)
      getProducts()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }
})
