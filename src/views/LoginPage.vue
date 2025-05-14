<script setup lang="ts"></script>

<template>
  <!-- component -->
  <div class="bg-[#1E293B]">
    <div class="flex justify-center h-screen">
      <div
        class="hidden bg-cover lg:block lg:w-2/3"
        style="
          background-image: url(https://images.unsplash.com/photo-1616763355603-9755a640a287?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80);
        "
      ></div>

      <div class="flex items-center w-full max-w-md px-6 mx-auto lg:w-2/6">
        <div class="flex-1">
          <div class="text-center">
            <h2 class="text-4xl font-bold text-center text-gray-700 dark:text-white">
              Trucks.land
            </h2>

            <p class="mt-3 text-gray-500 dark:text-gray-300">Sign in to access your account</p>
          </div>

          <div class="mt-8">
            <form>
              <div>
                <label for="email" class="block mb-2 text-sm text-gray-600 dark:text-gray-200"
                  >Email Address</label
                >
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="example@example.com"
                  class="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-400 border border-gray-200 rounded-md dark:placeholder-gray-600 bg-[#1E293B] dark:text-gray-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-400 focus:ring-blue-400 focus:outline-none focus:ring focus:ring-opacity-40"
                />
              </div>

              <div class="mt-6">
                <div class="flex justify-between mb-2">
                  <label for="password" class="text-sm text-gray-600 dark:text-gray-200"
                    >Password</label
                  >
                  <a
                    href="#"
                    class="text-sm text-gray-400 focus:text-blue-500 hover:text-blue-500 hover:underline"
                    >Forgot password?</a
                  >
                </div>

                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Your Password"
                  class="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-400 border border-gray-200 rounded-md dark:placeholder-gray-600 bg-[#1E293B] dark:text-gray-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-400 focus:ring-blue-400 focus:outline-none focus:ring focus:ring-opacity-40"
                />
              </div>

              <div class="mt-6">
                <button
                  class="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-[#313EC6] rounded-md hover:bg-blue-500 focus:outline-none focus:bg-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-50"
                >
                  Sign in
                </button>
              </div>
            </form>

            <p class="mt-6 text-sm text-center text-gray-400">
              Don&#x27;t have an account yet?
              <a href="#" class="text-blue-500 focus:outline-none focus:underline hover:underline"
                >Sign up</a
              >.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!--  <div class="grid grid-cols-12">-->
  <!--    <div class="col-span-4 text-white font-bold bg-[#1E293B] min-h-screen pl-7">-->
  <!--      <div class="grid grid-rows-6 grid-flow-col min-h-screen items-center justify-items-start">-->
  <!--        <div class="row-span-4 row-start-2 text-4xl">-->
  <!--          Sign In-->
  <!--          <div class="pt-10 pr-20">-->
  <!--            <label class="text-sm font-sans font-medium"> Username </label>-->
  <!--            <input-->
  <!--              type="text"-->
  <!--              name="username"-->
  <!--              placeholder="Write your username"-->
  <!--              class="w-full bg-[#1E293B] py-3 px-12 border hover: border-gray-500 rounded shadow text-base font-sans"-->
  <!--            />-->
  <!--          </div>-->
  <!--          <div class="pt-2 pr-20">-->
  <!--            <label class="text-sm font-sans font-medium"> Password </label>-->
  <!--            <input-->
  <!--              type="password"-->
  <!--              name="password"-->
  <!--              placeholder="Write your password"-->
  <!--              class="w-full bg-[#1E293B] py-3 px-12 border hover: border-gray-500 rounded shadow text-base font-sans"-->
  <!--            />-->
  <!--            <a href="" class="text-sm font-sans font-medium text-gray-600 underline">-->
  <!--              Forgot password?-->
  <!--            </a>-->
  <!--          </div>-->
  <!--          &lt;!&ndash; Button &ndash;&gt;-->
  <!--          <div class="text-sm font-sans font-medium w-full pr-20 pt-14">-->
  <!--            <button-->
  <!--              type="button"-->
  <!--              class="text-center w-full py-4 bg-[#313EC6] hover:bg-blue-500 rounded-md text-white"-->
  <!--            >-->
  <!--              SIGN IN-->
  <!--            </button>-->
  <!--          </div>-->
  <!--        </div>-->
  <!--        &lt;!&ndash; Text &ndash;&gt;-->
  <!--        <a href="" class="text-sm font-sans font-medium text-gray-400 underline">-->
  <!--          Don´t have an account? Sign up-->
  <!--        </a>-->
  <!--      </div>-->
  <!--    </div>-->

  <!--    &lt;!&ndash; Second column image &ndash;&gt;-->
  <!--    <div class="bg-blue-600">-->
  <!--      <img-->
  <!--        src="https://images.pexels.com/photos/2523959/pexels-photo-2523959.jpeg"-->
  <!--        class="h-full w-full"-->
  <!--      />-->
  <!--    </div>-->
  <!--  </div>-->
</template>

<style scoped></style>
