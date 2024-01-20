const promise = new Promise((reso, reje) => {
  setTimeout(() => {
    reso("wungus");
  }, 5000);
})

const promise2 = new Promise((resolved, reject) => {
  setTimeout(() => {
    resolved("chungus");
  });
});

const syncFn = () => {
  console.log("this is the async fn");
};

const asyncFn = async () => {
  console.log("inside the async fn");
  const wungus1 = await promise;
  console.log(wungus1);

  const chungus = await promise;
  console.log(chungus);
}
console.log("calling async fn");
asyncFn();
console.log("calling sync fn");
syncFn();
